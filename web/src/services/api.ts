import axios from 'axios';
import { Asset, Batch, CertificateInfo, TransportRecord } from '@/models';

const API_URL = '/api';

export async function ping(): Promise<string> {
  const response = await axios.get(`${API_URL}/ping`);
  return response.data.result;
}

export async function pingHola(name: string): Promise<string> {
  const response = await axios.get(`${API_URL}/pingHola/${name}`);
  return response.data.result;
}

// Asset Functions
export async function createAsset(asset: Omit<Asset, 'ID' | 'History'>): Promise<Asset> {
  const response = await axios.post(`${API_URL}/assets`, asset);
  return response.data;
}

export async function getAsset(id: string): Promise<Asset> {
  const response = await axios.get(`${API_URL}/assets/${id}`);
  return response.data;
}

export async function queryAssets(query: any): Promise<Asset[]> {
  const response = await axios.post(`${API_URL}/assets/query`, query);
  return response.data;
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
  const response = await axios.put(`${API_URL}/assets/${id}`, updates);
  return response.data;
}

export async function transferAsset(id: string, newOwner: string): Promise<Asset> {
  const response = await axios.post(`${API_URL}/assets/${id}/transfer`, { newOwner });
  return response.data;
}

// Batch Functions
export async function createBatch(batch: Omit<Batch, 'ID'>): Promise<Batch> {
  const response = await axios.post(`${API_URL}/batches`, batch);
  return response.data;
}

export async function getBatch(id: string): Promise<Batch> {
  const response = await axios.get(`${API_URL}/batches/${id}`);
  return response.data;
}

export async function queryBatches(query: any): Promise<Batch[]> {
  const response = await axios.post(`${API_URL}/batches/query`, query);
  return response.data;
}

export async function updateBatchStatus(id: string, status: string): Promise<Batch> {
  const response = await axios.put(`${API_URL}/batches/${id}/status`, { status });
  return response.data;
}

// Certificate Functions
export async function createCertificate(certificate: Omit<CertificateInfo, 'ID'>): Promise<CertificateInfo> {
  const response = await axios.post(`${API_URL}/certificates`, certificate);
  return response.data;
}

export async function getCertificate(id: string): Promise<CertificateInfo> {
  const response = await axios.get(`${API_URL}/certificates/${id}`);
  return response.data;
}

export async function queryCertificates(query: any): Promise<CertificateInfo[]> {
  const response = await axios.post(`${API_URL}/certificates/query`, query);
  return response.data;
}

export async function updateCertificate(id: string, updates: Partial<CertificateInfo>): Promise<CertificateInfo> {
  const response = await axios.put(`${API_URL}/certificates/${id}`, updates);
  return response.data;
}

// Transport Functions
export async function createTransportRecord(record: Omit<TransportRecord, 'ID'>): Promise<TransportRecord> {
  const response = await axios.post(`${API_URL}/transport`, record);
  return response.data;
}

export async function getTransportRecord(id: string): Promise<TransportRecord> {
  const response = await axios.get(`${API_URL}/transport/${id}`);
  return response.data;
}

export async function updateTransportStatus(id: string, status: string, actualArrival?: string): Promise<TransportRecord> {
  const response = await axios.put(`${API_URL}/transport/${id}/status`, { status, actualArrival });
  return response.data;
}

export async function reportTransportIncident(id: string, incident: any): Promise<TransportRecord> {
  const response = await axios.post(`${API_URL}/transport/${id}/incidents`, incident);
  return response.data;
}

// Trazabilidad
export async function getTraceability(assetId: string): Promise<any> {
  const response = await axios.get(`${API_URL}/traceability/${assetId}`);
  return response.data;
}
