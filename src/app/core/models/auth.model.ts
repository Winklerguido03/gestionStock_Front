export interface LoginRequest {
  username: string;   // es el email
  password: string;
}

export interface UsuarioCreateRequest {
  username: string;     // email válido (@NotNull + @Email)
  password: string;     // entre 8 y 20 caracteres
}

export interface AuthResponse {
  token: string;
}

export interface VerificarCuentaResponse {
  message: string;
}
