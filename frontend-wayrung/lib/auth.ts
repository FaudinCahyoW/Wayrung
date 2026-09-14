import { api } from "./api";
import { Login, LoginResponse } from "../types/login";
 
// Bentuk mentah response dari backend: { message: string, data: LoginResponse }
interface LoginApiEnvelope {
  message: string;
  data: LoginResponse;
}
 
export async function login(data: Login): Promise<LoginResponse> {
  const res = await api.post<LoginApiEnvelope>("/auth/login", data);
  // Backend membungkus payload asli di dalam field "data" -> harus di-unwrap di sini
  return res.data.data;
}
 