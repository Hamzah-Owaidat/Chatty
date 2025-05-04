import api from './client';

export async function login(creadentiels: {username: string, password: string}) {
    const response = await api.post('/auth/login', creadentiels);
    return response.data;
}

export async function register(data: {username: string, displayName: string, email: string, password: string}){
    const response = await api.post('/auth/register', data);
    return response.data;
}

export async function logout(){
    const response = await api.post('/auth/logout');
    return response.data;
}

export async function getCurrentUser(){
    const response = await api.post('/auth/me');
    return response.data;
}