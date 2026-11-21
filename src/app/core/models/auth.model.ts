export interface LoginRequest {
  email: string;   // es el email
  password: string;
}

export interface UsuarioCreateRequest {
  email: string;     // email válido (@NotNull + @Email)
  password: string;     // entre 8 y 20 caracteres
}

export interface AuthResponse {
  token: string;
}

export interface VerificarCuentaResponse {
  message: string;
}
