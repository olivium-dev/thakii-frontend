/**
 * Mock API service - drop-in replacement for apiService when VITE_MOCK_MODE=true.
 * All methods use JSON fixtures and configurable delays. In-memory state for CRUD.
 */

import { getMockDelay, getMockUploadDuration } from './mockConfig';

import healthData from './data/health.json';
import videosData from './data/videos.json';
import uploadResponseData from './data/uploadResponse.json';
import downloadResponseData from './data/downloadResponse.json';
import adminVideosData from './data/adminVideos.json';
import adminStatsData from './data/adminStats.json';
import serversData from './data/servers.json';
import adminsData from './data/admins.json';
import adminStatsRolesData from './data/adminStatsRoles.json';
import batchJobsData from './data/batchJobs.json';
import creditBalanceData from './data/creditBalance.json';
import creditPackagesData from './data/creditPackages.json';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Mutable in-memory state (cloned from fixtures)
let videos = JSON.parse(JSON.stringify(videosData));
let servers = JSON.parse(JSON.stringify(serversData));
let admins = JSON.parse(JSON.stringify(adminsData));
let creditBalance = creditBalanceData.credits;

function getDelay() {
  return getMockDelay();
}

export const mockApiService = {
  async checkHealth() {
    await delay(getDelay());
    return { ...healthData, timestamp: new Date().toISOString() };
  },

  async uploadVideo(file, onUploadProgress) {
    const duration = getMockUploadDuration();
    const steps = 20;
    const stepMs = duration / steps;
    for (let i = 0; i <= steps; i++) {
      await delay(stepMs);
      if (onUploadProgress) onUploadProgress(Math.round((i / steps) * 100));
    }
    const videoId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newVideo = {
      video_id: videoId,
      filename: file.name,
      status: 'in_queue',
      upload_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    videos = [newVideo, ...videos];
    return { ...uploadResponseData, video_id: videoId, message: 'Video uploaded successfully' };
  },

  async getVideoList() {
    await delay(getDelay());
    return { videos: [...videos], total: videos.length };
  },

  async getVideoStatus(videoId) {
    await delay(getDelay());
    const video = videos.find((v) => v.video_id === videoId);
    return video || { video_id: videoId, status: 'unknown' };
  },

  async downloadPdf(videoId, _originalFilename) {
    await delay(getDelay());
    const video = videos.find((v) => v.video_id === videoId);
    const filename = (video && video.filename ? video.filename : videoId).replace(/\.[^/.]+$/, '') + '.pdf';
    const blob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    return { download_url: downloadUrl, filename, video_id: videoId };
  },

  async cancelVideo(videoId, _reason, _cleanupCompleted) {
    await delay(getDelay());
    videos = videos.filter((v) => v.video_id !== videoId);
    return { message: 'Video cancelled successfully' };
  },

  async importSingleUrl(url, filename) {
    await delay(getDelay());
    const name = filename || url.split('/').pop().split('?')[0] || 'imported_video.mp4';
    const videoId = `mock-import-${Date.now()}`;
    const newVideo = {
      video_id: videoId,
      filename: name,
      status: 'in_queue',
      upload_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    videos = [newVideo, ...videos];
    return { video_id: videoId, message: 'Import started' };
  },

  async submitBatchImport(shareUrl) {
    await delay(getDelay());
    const jobId = `batch-mock-${Date.now()}`;
    return {
      success: true,
      job_id: jobId,
      total_videos: 3,
      total_size: 0,
    };
  },

  async getBatchJobStatus(jobId) {
    await delay(getDelay());
    const job = batchJobsData.find((j) => j.job_id === jobId) || batchJobsData[0];
    return {
      ...job,
      job_id: jobId,
      videos: videos.slice(0, 3).map((v) => ({
        video_name: v.filename,
        status: v.status,
        progress_percent: v.progress_percent,
      })),
    };
  },

  async listBatchJobs(limit = 20) {
    await delay(getDelay());
    return { jobs: batchJobsData.slice(0, limit) };
  },

  async getCreditsBalance() {
    await delay(getDelay());
    return { credits: creditBalance };
  },

  async getCreditPackages() {
    await delay(getDelay());
    return { packages: JSON.parse(JSON.stringify(creditPackagesData)) };
  },

  async purchaseCreditPackage(packageId) {
    await delay(getDelay() * 2);
    const pkg = creditPackagesData.find((p) => p.id === packageId);
    if (!pkg) throw new Error(`Unknown package: ${packageId}`);
    creditBalance += pkg.credits;
    return {
      success: true,
      credits_added: pkg.credits,
      new_balance: creditBalance,
      transaction_id: `mock-tx-${Date.now()}`,
    };
  },

  async getAllVideosAdmin() {
    await delay(getDelay());
    return videos.map((v) => ({
      id: v.video_id,
      video_name: v.filename,
      status: v.status,
      user_email: 'demo@thakii.com',
      date: v.upload_date,
    }));
  },

  async getSystemStats() {
    await delay(getDelay());
    return { ...adminStatsData };
  },

  async sendTestNotification(type = 'simple') {
    await delay(getDelay());
    return { success: true, type };
  },

  async getServers() {
    await delay(getDelay());
    return [...servers];
  },

  async addServer(serverData) {
    await delay(getDelay());
    const newServer = {
      id: `server-${Date.now()}`,
      ...serverData,
      status: 'unknown',
      last_check: new Date().toISOString(),
    };
    servers.push(newServer);
    return { success: true, message: 'Server added successfully', ...newServer };
  },

  async updateServer(serverId, serverData) {
    await delay(getDelay());
    const idx = servers.findIndex((s) => s.id === serverId);
    if (idx === -1) throw new Error('Server not found');
    servers[idx] = { ...servers[idx], ...serverData };
    return { success: true, message: 'Server updated successfully', ...servers[idx] };
  },

  async removeServer(serverId) {
    await delay(getDelay());
    servers = servers.filter((s) => s.id !== serverId);
    return { success: true, message: 'Server removed successfully' };
  },

  async checkServersHealth() {
    await delay(getDelay());
    return servers.map((s) => ({ ...s, status: 'healthy' }));
  },

  async getAdmins() {
    await delay(getDelay());
    return [...admins];
  },

  async addAdmin(adminData) {
    await delay(getDelay());
    const newAdmin = {
      id: `admin-${Date.now()}`,
      ...adminData,
    };
    admins.push(newAdmin);
    return newAdmin;
  },

  async updateAdmin(adminId, adminData) {
    await delay(getDelay());
    const idx = admins.findIndex((a) => a.id === adminId);
    if (idx === -1) throw new Error('Admin not found');
    admins[idx] = { ...admins[idx], ...adminData };
    return admins[idx];
  },

  async removeAdmin(adminId) {
    await delay(getDelay());
    admins = admins.filter((a) => a.id !== adminId);
    return { success: true };
  },

  async getAdminStats() {
    await delay(getDelay());
    return { ...adminStatsRolesData };
  },
};

export default mockApiService;
