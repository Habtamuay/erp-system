import prometheusClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create metrics registry
const register = new prometheusClient.Registry();
prometheusClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new prometheusClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestsTotal = new prometheusClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeSessions = new prometheusClient.Gauge({
  name: 'active_sessions_total',
  help: 'Total number of active user sessions',
});

export const databaseQueryDuration = new prometheusClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

export const businessMetrics = {
  dailyRevenue: new prometheusClient.Gauge({
    name: 'business_daily_revenue',
    help: 'Daily revenue amount',
  }),
  
  ordersTotal: new prometheusClient.Counter({
    name: 'business_orders_total',
    help: 'Total number of orders',
    labelNames: ['status'],
  }),
  
  inventoryValue: new prometheusClient.Gauge({
    name: 'business_inventory_value',
    help: 'Total inventory value',
  }),
};

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeSessions);
register.registerMetric(databaseQueryDuration);
Object.values(businessMetrics).forEach(metric => register.registerMetric(metric));

// Middleware to collect metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

// Metrics endpoint
export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Background metrics collection
export const startMetricsCollection = async () => {
  setInterval(async () => {
    // Update business metrics every 5 minutes
    const revenue = await getTodayRevenue();
    businessMetrics.dailyRevenue.set(revenue);
    
    const inventory = await getTotalInventoryValue();
    businessMetrics.inventoryValue.set(inventory);
  }, 5 * 60 * 1000);
};