"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, json, colorize, printf, errors } = winston_1.default.format;
const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${ts} [${level}] ${message}${metaStr}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)),
    transports: [
        new winston_1.default.transports.Console(),
        ...(process.env.NODE_ENV === 'production'
            ? [
                new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
            ]
            : []),
    ],
});
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map