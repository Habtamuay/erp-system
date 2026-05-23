import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Production-grade secret management
class SecretManager {
  private static instance: SecretManager;
  private secrets: Map<string, { value: string; expiresAt: Date }> = new Map();

  static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  async getJWTSecret(): Promise<string> {
    // Try environment variable first (Kubernetes secrets / Docker secrets)
    let secret = process.env.JWT_SECRET;
    
    if (secret) {
      return secret;
    }

    // Try AWS Secrets Manager (if in cloud)
    if (process.env.AWS_REGION) {
      secret = await this.getSecretFromAWS('erp/jwt-secret');
      if (secret) return secret;
    }

    // Try HashiCorp Vault (if configured)
    if (process.env.VAULT_ADDR) {
      secret = await this.getSecretFromVault('secret/erp/jwt');
      if (secret) return secret;
    }

    // Fallback to encrypted local file (for on-premise)
    secret = await this.getSecretFromFile('/run/secrets/jwt_secret');
    if (secret) return secret;

    throw new Error('JWT secret not found in any secret store');
  }

  private async getSecretFromAWS(secretName: string): Promise<string | null> {
    try {
      const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
      const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
      return response.SecretString || null;
    } catch (error) {
      console.error('AWS Secrets Manager error:', error);
      return null;
    }
  }

  private async getSecretFromVault(path: string): Promise<string | null> {
    try {
      const response = await fetch(`${process.env.VAULT_ADDR}/v1/${path}`, {
        headers: { 'X-Vault-Token': process.env.VAULT_TOKEN || '' },
      });
      const data = await response.json();
      return data?.data?.value || null;
    } catch (error) {
      console.error('Vault error:', error);
      return null;
    }
  }

  private async getSecretFromFile(filePath: string): Promise<string | null> {
    try {
      const fs = await import('fs/promises');
      const secret = await fs.readFile(filePath, 'utf-8');
      return secret.trim();
    } catch (error) {
      return null;
    }
  }

  // Rotate secrets periodically
  async rotateJWTSecret(): Promise<void> {
    const newSecret = crypto.randomBytes(64).toString('hex');
    const newSecretHash = crypto.createHash('sha256').update(newSecret).digest('hex');
    
    // Store old secret for grace period (5 minutes)
    const oldSecret = await this.getJWTSecret();
    this.secrets.set(oldSecret, {
      value: oldSecret,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Update secret in secret store
    await this.updateSecretInStore(newSecret);
    
    console.log('JWT secret rotated successfully');
  }

  private async updateSecretInStore(newSecret: string): Promise<void> {
    if (process.env.AWS_REGION) {
      // Update AWS Secrets Manager
      const { SecretsManagerClient, PutSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
      await client.send(new PutSecretValueCommand({
        SecretId: 'erp/jwt-secret',
        SecretString: newSecret,
      }));
    }
  }

  verifyToken(token: string): any {
    // Check with current and recently rotated secrets
    for (const [secret, info] of this.secrets) {
      if (info.expiresAt > new Date()) {
        try {
          return jwt.verify(token, secret);
        } catch (e) {
          continue;
        }
      }
    }
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}

export const secretManager = SecretManager.getInstance();