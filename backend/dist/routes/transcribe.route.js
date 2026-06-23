"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const transcribe_controller_1 = require("../controllers/transcribe.controller");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported audio format: ${file.mimetype}`));
        }
    },
});
exports.transcribeRouter = (0, express_1.Router)();
/**
 * POST /api/transcribe
 * Body: multipart/form-data { audio: File }
 * Returns: { transcript, confidence, durationSeconds, language }
 */
exports.transcribeRouter.post('/', upload.single('audio'), transcribe_controller_1.transcribeController);
//# sourceMappingURL=transcribe.route.js.map