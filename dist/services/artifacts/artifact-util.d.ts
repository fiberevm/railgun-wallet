import { ArtifactName, ArtifactMapping } from '@railgun-community/shared-models';
export declare const artifactDownloadsDir: (artifactVariantString: string) => string;
export declare const getArtifactVariantString: (nullifiers: number, commitments: number) => string;
export declare const artifactDownloadsPath: (artifactName: ArtifactName, artifactVariantString: string) => string;
export declare const getArtifactDownloadsPaths: (artifactVariantString: string) => ArtifactMapping;
export declare const decompressArtifact: (arrayBuffer: ArrayBuffer) => Uint8Array;
export declare const getArtifactUrl: (artifactName: ArtifactName, artifactVariantString: string) => string;
