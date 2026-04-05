const API_BASE_URL = '/api';
import { supabase } from './supabase';export interface Tour {
    id: number;
    title: string;
    duration: string;
    location: string;
    price: number;
    rating: number;
    reviews: number;
    category: string;
    image: string;
    gallery?: string[];
    description?: string;
    operator?: string;
    operator_name?: string;
    company_name?: string;
    badges?: string[];
    highlights?: string[];
    included?: string[];
    cancellationPolicy?: string;
    maxGroupSize?: number;
    languages?: string[];
    itinerary?: { day: number; title: string; description: string; activities: string[] }[];
    status?: string;
}

export const fetchTours = async (category?: string, search?: string): Promise<Tour[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/tours?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch tours');
    return response.json();
};

export const fetchCategories = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
};


// --- AUTH & USER API ---

export interface User {
    id: string; // Changed from number to string for Supabase UUID
    name: string;
    email: string;
    company_name?: string;
    phone?: string;
    avatar_url?: string;
    role?: string;
}

export const setToken = (token: string, remember: boolean = true) => {
    if (remember) {
        localStorage.setItem('auth_token', token);
    } else {
        sessionStorage.setItem('auth_token', token);
    }
};
export const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
export const removeToken = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
};

export const deleteAccount = async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to delete account');
    removeToken();
    return result;
};


export const initiateRegistration = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    
    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error(`Server error: ${text.slice(0, 100)}`);
    }

    if (!response.ok) throw new Error(result.error || 'Failed to initiate registration');
    return result; // Should return { phone }
};

export const completeRegistration = async (email: string, code: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Verification failed');
    return result; // Returns { user, token }
};

export const registerUser = async (data: any) => {
    // Legacy - redirected to initiate
    return initiateRegistration(data);
};

export const loginUser = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        if (text.trim().startsWith('<!DOCTYPE html>')) {
             throw new Error("Proxy error: The server is returning the website's HTML instead of a data response. Please ensure you restarted 'npm run dev:all'.");
        }
        throw new Error(`Server returned an invalid response (Status ${response.status}): ${text.slice(0, 100) || '[Empty Response]'}`);
    }

    if (!response.ok) throw new Error(result.error || `Login failed (${response.status})`);
    return result;
};

export const googleLogin = async (credential: string, role?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, role }),
    });

    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error(`Server returned an invalid response: ${text.slice(0, 100)}`);
    }

    if (!response.ok) throw new Error(result.error || 'Google login failed');
    return result;
};


export const getMe = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            removeToken();
            return null;
        }
        const result = await response.json();
        return result.user;
    } catch (error) {
        return null;
    }
};

export const updateMe = async (data: Partial<User>) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update profile');
    return result;
};

export const initiatePasswordChange = async (newPassword: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/password/initiate`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to initiate password change');
    return result;
};

export const completePasswordChange = async (code: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/password/complete`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to complete password change');
    return result;
};

export const initiateGuestPasswordReset = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/password/forgot/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    
    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error(`Server error: ${text.slice(0, 100) || '[Empty Response]'}`);
    }
    if (!response.ok) throw new Error(result.error || 'Failed to initiate password reset');
    return result;
};

export const verifyGuestPasswordResetCode = async (email: string, code: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/password/forgot/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    });
    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error(`Server error: ${text.slice(0, 100) || '[Empty Response]'}`);
    }
    if (!response.ok) throw new Error(result.error || 'Verification failed');
    return result;
};

export const completeGuestPasswordReset = async (email: string, code: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/password/forgot/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
    });
    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error(`Server error: ${text.slice(0, 100) || '[Empty Response]'}`);
    }
    if (!response.ok) throw new Error(result.error || 'Failed to process password change');
    return result;
};


export const uploadFileToSupabase = async (file: File, bucket: string = 'tours') => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.details || 'Upload failed');
    return result.url;
};

export const uploadAvatar = async (file: File) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const publicUrl = await uploadFileToSupabase(file, 'avatars');

    const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ avatar_url: publicUrl }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to upload avatar');
    return result;
};

// removed fetchTours duplicate
export const createTour = async (formData: FormData) => {
    const token = getToken();
    
    // Extract and upload main image
    const mainImageFile = formData.get('image') as File | null;
    let imageUrl = '';
    if (mainImageFile && mainImageFile.size > 0) {
        try {
            imageUrl = await uploadFileToSupabase(mainImageFile, 'tours');
        } catch(e: any) {
            throw new Error('Failed to upload main image: ' + e.message);
        }
    } else {
        imageUrl = formData.get('imageUrl') as string || '';
    }

    // Extract and upload gallery images
    const galleryFiles = formData.getAll('gallery') as File[];
    const galleryUrls: string[] = [];
    for (const file of galleryFiles) {
        if (file && file.size > 0) {
            const url = await uploadFileToSupabase(file, 'tours');
            galleryUrls.push(url);
        }
    }

    const existingGallery = formData.get('existingGallery') as string || '[]';

    // Extract itinerary images (dynamic fields `itineraryImage_${i}`)
    let itineraryJson = formData.get('itinerary') as string || '[]';
    let itinerary = JSON.parse(itineraryJson);
    
    for (let i = 0; i < itinerary.length; i++) {
        const dayImage = formData.get(`itineraryImage_${i}`) as File | null;
        if (dayImage && dayImage.size > 0) {
            const url = await uploadFileToSupabase(dayImage, 'tours');
            itinerary[i].image = url;
        }
    }

    const payload = {
        title: formData.get('title'),
        category: formData.get('category'),
        location: formData.get('location'),
        duration: formData.get('duration'),
        description: formData.get('description'),
        price: formData.get('price'),
        maxGroupSize: formData.get('maxGroupSize'),
        itinerary: JSON.stringify(itinerary),
        imageUrl: imageUrl,
        existingGallery: existingGallery,
        newGalleryUrls: JSON.stringify(galleryUrls)
    };

    const response = await fetch(`${API_BASE_URL}/tours`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create tour');
    return result;
};

export const updateTour = async (id: number, formData: FormData) => {
    const token = getToken();
    
    // Extract and upload main image
    const mainImageFile = formData.get('image') as File | null;
    let imageUrl = '';
    if (mainImageFile && mainImageFile.size > 0) {
        try {
            imageUrl = await uploadFileToSupabase(mainImageFile, 'tours');
        } catch(e: any) {
            throw new Error('Failed to upload main image: ' + e.message);
        }
    } else {
        imageUrl = formData.get('imageUrl') as string || '';
    }

    // Extract and upload gallery images
    const galleryFiles = formData.getAll('gallery') as File[];
    const galleryUrls: string[] = [];
    for (const file of galleryFiles) {
        if (file && file.size > 0) {
            const url = await uploadFileToSupabase(file, 'tours');
            galleryUrls.push(url);
        }
    }

    const existingGallery = formData.get('existingGallery') as string || '[]';

    // Extract itinerary images
    let itineraryJson = formData.get('itinerary') as string || '[]';
    let itinerary = JSON.parse(itineraryJson);
    
    for (let i = 0; i < itinerary.length; i++) {
        const dayImage = formData.get(`itineraryImage_${i}`) as File | null;
        if (dayImage && dayImage.size > 0) {
            const url = await uploadFileToSupabase(dayImage, 'tours');
            itinerary[i].image = url;
        }
    }

    const payload = {
        title: formData.get('title'),
        category: formData.get('category'),
        location: formData.get('location'),
        duration: formData.get('duration'),
        description: formData.get('description'),
        price: formData.get('price'),
        maxGroupSize: formData.get('maxGroupSize'),
        itinerary: JSON.stringify(itinerary),
        imageUrl: imageUrl,
        existingGallery: existingGallery,
        newGalleryUrls: JSON.stringify(galleryUrls)
    };

    const response = await fetch(`${API_BASE_URL}/tours/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update tour');
    return result;
};

export const fetchMyTours = async (): Promise<Tour[]> => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE_URL}/tours/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch user tours');
    return response.json();
};

export const updateTourStatus = async (id: number, status: 'published' | 'paused') => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE_URL}/tours/${id}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
};

export const deleteTour = async (id: number) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE_URL}/tours/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete tour');
    return response.json();
};

export const createBooking = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Booking failed');
    return result;
};

export const fetchMyBookings = async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE_URL}/bookings/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
};
