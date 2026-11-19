export interface User
{ id: number; // = id
username: string; // = sub
role: Role; // = rol
}

export enum Role {
  ADMINISTRADOR = 'ADMINISTRADOR',
  EMPLEADO = 'EMPLEADO'
}