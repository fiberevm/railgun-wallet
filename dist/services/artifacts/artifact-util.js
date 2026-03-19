"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArtifactUrl = exports.decompressArtifact = exports.getArtifactDownloadsPaths = exports.artifactDownloadsPath = exports.getArtifactVariantString = exports.artifactDownloadsDir = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const decompress_1 = __importDefault(require("brotli/decompress"));
const ARTIFACT_CDN_BASE_URL = 'https://d28nqgx4vebmjg.cloudfront.net/railgun/v2';
const artifactDownloadsDir = (artifactVariantString) => {
    return `artifacts-v2.1/${artifactVariantString}`;
};
exports.artifactDownloadsDir = artifactDownloadsDir;
const getArtifactVariantString = (nullifiers, commitments) => {
    return `${nullifiers.toString().padStart(2, '0')}x${commitments.toString().padStart(2, '0')}`;
};
exports.getArtifactVariantString = getArtifactVariantString;
const artifactDownloadsPath = (artifactName, artifactVariantString) => {
    switch (artifactName) {
        case shared_models_1.ArtifactName.WASM:
            return `${(0, exports.artifactDownloadsDir)(artifactVariantString)}/wasm`;
        case shared_models_1.ArtifactName.ZKEY:
            return `${(0, exports.artifactDownloadsDir)(artifactVariantString)}/zkey`;
        case shared_models_1.ArtifactName.VKEY:
            return `${(0, exports.artifactDownloadsDir)(artifactVariantString)}/vkey.json`;
        case shared_models_1.ArtifactName.DAT:
            return `${(0, exports.artifactDownloadsDir)(artifactVariantString)}/dat`;
    }
};
exports.artifactDownloadsPath = artifactDownloadsPath;
const getArtifactDownloadsPaths = (artifactVariantString) => {
    return {
        [shared_models_1.ArtifactName.ZKEY]: (0, exports.artifactDownloadsPath)(shared_models_1.ArtifactName.ZKEY, artifactVariantString),
        [shared_models_1.ArtifactName.WASM]: (0, exports.artifactDownloadsPath)(shared_models_1.ArtifactName.WASM, artifactVariantString),
        [shared_models_1.ArtifactName.VKEY]: (0, exports.artifactDownloadsPath)(shared_models_1.ArtifactName.VKEY, artifactVariantString),
        [shared_models_1.ArtifactName.DAT]: (0, exports.artifactDownloadsPath)(shared_models_1.ArtifactName.DAT, artifactVariantString),
    };
};
exports.getArtifactDownloadsPaths = getArtifactDownloadsPaths;
const decompressArtifact = (arrayBuffer) => {
    const decompress = decompress_1.default;
    return decompress(Buffer.from(arrayBuffer));
};
exports.decompressArtifact = decompressArtifact;
const getArtifactFilepath = (artifactName, artifactVariantString) => {
    switch (artifactName) {
        case shared_models_1.ArtifactName.ZKEY:
            return `circuits/${artifactVariantString}/zkey.br`;
        case shared_models_1.ArtifactName.WASM:
            return `prover/snarkjs/${artifactVariantString}.wasm.br`;
        case shared_models_1.ArtifactName.VKEY:
            return `circuits/${artifactVariantString}/vkey.json`;
        case shared_models_1.ArtifactName.DAT:
            return `prover/native/${artifactVariantString}.dat.br`;
    }
    throw new Error('Invalid artifact.');
};
const getArtifactUrl = (artifactName, artifactVariantString) => {
    const artifactFilepath = getArtifactFilepath(artifactName, artifactVariantString);
    return `${ARTIFACT_CDN_BASE_URL}/${artifactFilepath}`;
};
exports.getArtifactUrl = getArtifactUrl;
//# sourceMappingURL=artifact-util.js.map