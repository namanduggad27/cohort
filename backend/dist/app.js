"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_middleware_1 = require("./middleware/logger.middleware");
const health_route_1 = require("./routes/health.route");
const transcribe_route_1 = require("./routes/transcribe.route");
const extract_route_1 = require("./routes/extract.route");
const context_route_1 = require("./routes/context.route");
const soap_route_1 = require("./routes/soap.route");
const consultation_route_1 = require("./routes/consultation.route");
const patientSlip_route_1 = require("./routes/patientSlip.route");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ─── Security & Parsing ──────────────────────────────────────
app.use(express_1.default.json({ limit: process.env.REQUEST_SIZE_LIMIT || '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
// ─── Rate Limiting ────────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.API_RATE_LIMIT) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);
// ─── Request Logger ───────────────────────────────────────────
app.use(logger_middleware_1.requestLogger);
// ─── Routes ───────────────────────────────────────────────────
app.use('/api/health', health_route_1.healthRouter);
app.use('/api/transcribe', transcribe_route_1.transcribeRouter);
app.use('/api/extract', extract_route_1.extractRouter);
app.use('/api/retrieve-context', context_route_1.contextRouter);
app.use('/api/generate-soap', soap_route_1.soapRouter);
app.use('/api/consultation', consultation_route_1.consultationRouter);
app.use('/api/patient-slip', patientSlip_route_1.patientSlipRouter);
// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
});
// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, _next) => {
    logger_1.logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});
// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
    logger_1.logger.info(`Clinical Scribe Backend running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map