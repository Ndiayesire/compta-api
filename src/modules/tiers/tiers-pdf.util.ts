import { execFile } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { InternalServerErrorException } from '@nestjs/common';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function resolveLibreOfficeCommand(): string {
  if (process.env.LIBREOFFICE_BIN?.trim()) {
    return process.env.LIBREOFFICE_BIN.trim();
  }
  return process.platform === 'win32' ? 'soffice.exe' : 'soffice';
}

/**
 * Convertit directement le fichier Excel en PDF
 * (mise en page identique au classeur source).
 */
export async function convertExcelBufferToPdf(
  excelBuffer: Buffer,
  baseName: string,
): Promise<Buffer> {
  const tempDir = await mkdtemp(join(tmpdir(), 'tiers-pdf-'));
  const xlsxPath = join(tempDir, `${baseName}.xlsx`);
  const pdfPath = join(tempDir, `${baseName}.pdf`);
  const soffice = resolveLibreOfficeCommand();

  try {
    await writeFile(xlsxPath, excelBuffer);

    await execFileAsync(
      soffice,
      ['--headless', '--convert-to', 'pdf', '--outdir', tempDir, xlsxPath],
      { windowsHide: true },
    );

    return await readFile(pdfPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new InternalServerErrorException(
      `Conversion PDF impossible depuis le fichier Excel: ${message}`,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
