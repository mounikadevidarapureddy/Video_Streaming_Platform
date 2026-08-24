const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const resolveMediaUrl = (url) => {
  if (!url || url.startsWith('http')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('flixit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const request = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }
  return data;
};

export const api = {
  // AUTH
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: profileData }),
  
  // PASSWORD RECOVERY (OTP)
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  verifyOtp: (email, otp) => request('/auth/verify-otp', { method: 'POST', body: { email, otp } }),
  resetPassword: (email, otp, newPassword) => request('/auth/reset-password', { method: 'POST', body: { email, otp, newPassword } }),

  // VIDEOS
  getVideos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/videos?${query}`);
  },
  getVideoById: (id) => request(`/videos/${id}`),
  uploadVideo: (formData) => request('/videos/upload', { method: 'POST', body: formData }),
  updateVideo: (id, videoData) => request(`/videos/${id}`, { method: 'PUT', body: videoData }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  addChapter: (id, chapterData) => request(`/videos/${id}/chapters`, { method: 'POST', body: chapterData }),

  // ANALYTICS
  getCreatorAnalytics: () => request('/analytics/creator'),

  // MONETIZATION & STRIPE
  subscribe: (plan_name) => request('/payments/subscribe', { method: 'POST', body: { plan_name } }),
  cancelSubscription: () => request('/payments/cancel-subscription', { method: 'POST' }),
  unlockPpv: (video_id) => request('/payments/unlock-ppv', { method: 'POST', body: { video_id } }),
  tipCreator: (tipData) => request('/payments/tip-creator', { method: 'POST', body: tipData }),

  // RECOMMENDATIONS
  getRecommendations: () => request('/recommendations')
};
