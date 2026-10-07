import { UserLogin, UserRegister, UserResponse } from "../types";
import { apiFetch } from "./client";

export async function register(args: UserRegister): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/register", { method: "POST", body: JSON.stringify(args) });
}

export async function login(args: UserLogin): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/login", { method: "POST", body: JSON.stringify(args) });
}
