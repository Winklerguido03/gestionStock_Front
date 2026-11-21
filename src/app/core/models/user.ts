export interface User
{ id: number; // = id
username: string;// = sub
email:string; 
role: Role; // = rol
}

export enum Role {
  ADMINISTRADOR = 'ADMINISTRADOR',
  EMPLEADO = 'EMPLEADO'
}