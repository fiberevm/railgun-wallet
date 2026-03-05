import {
  ArtifactName,
  ArtifactMapping,
} from '@railgun-community/shared-models';
import brotliDecompress from 'brotli/decompress';

const ARTIFACT_CDN_BASE_URL =
  'https://d28nqgx4vebmjg.cloudfront.net/railgun/v2';

export const artifactDownloadsDir = (artifactVariantString: string) => {
  return `artifacts-v2.1/${artifactVariantString}`;
};

export const getArtifactVariantString = (
  nullifiers: number,
  commitments: number,
) => {
  return `${nullifiers.toString().padStart(2, '0')}x${commitments.toString().padStart(2, '0')}`;
};

export const artifactDownloadsPath = (
  artifactName: ArtifactName,
  artifactVariantString: string,
): string => {
  switch (artifactName) {
    case ArtifactName.WASM:
      return `${artifactDownloadsDir(artifactVariantString)}/wasm`;
    case ArtifactName.ZKEY:
      return `${artifactDownloadsDir(artifactVariantString)}/zkey`;
    case ArtifactName.VKEY:
      return `${artifactDownloadsDir(artifactVariantString)}/vkey.json`;
    case ArtifactName.DAT:
      return `${artifactDownloadsDir(artifactVariantString)}/dat`;
  }
};

export const getArtifactDownloadsPaths = (
  artifactVariantString: string,
): ArtifactMapping => {
  return {
    [ArtifactName.ZKEY]: artifactDownloadsPath(
      ArtifactName.ZKEY,
      artifactVariantString,
    ),
    [ArtifactName.WASM]: artifactDownloadsPath(
      ArtifactName.WASM,
      artifactVariantString,
    ),
    [ArtifactName.VKEY]: artifactDownloadsPath(
      ArtifactName.VKEY,
      artifactVariantString,
    ),
    [ArtifactName.DAT]: artifactDownloadsPath(
      ArtifactName.DAT,
      artifactVariantString,
    ),
  };
};

export const decompressArtifact = (arrayBuffer: ArrayBuffer): Uint8Array => {
  const decompress = brotliDecompress as (input: Uint8Array) => Uint8Array;
  return decompress(Buffer.from(arrayBuffer));
};

const getArtifactFilepath = (
  artifactName: ArtifactName,
  artifactVariantString: string,
) => {
  switch (artifactName) {
    case ArtifactName.ZKEY:
      return `circuits/${artifactVariantString}/zkey.br`;
    case ArtifactName.WASM:
      return `prover/snarkjs/${artifactVariantString}.wasm.br`;
    case ArtifactName.VKEY:
      return `circuits/${artifactVariantString}/vkey.json`;
    case ArtifactName.DAT:
      return `prover/native/${artifactVariantString}.dat.br`;
  }
  throw new Error('Invalid artifact.');
};

export const getArtifactUrl = (
  artifactName: ArtifactName,
  artifactVariantString: string,
) => {
  const artifactFilepath = getArtifactFilepath(
    artifactName,
    artifactVariantString,
  );

  return `${ARTIFACT_CDN_BASE_URL}/${artifactFilepath}`;
};
