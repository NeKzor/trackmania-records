import mongoose from 'mongoose';

export type ConnectOptions = {
  username: string;
  password: string;
  host: string;
  port: string | number;
  database: string;
};

export class Database {
  async connect(options: ConnectOptions) {
    const host = `${options.host}:${options.port}/${options.database}`;

    console.log(`[DB] Connecting to ${host}`);

    if (await mongoose.connect(`mongodb://${options.username}:${options.password}@` + host)) {
      console.log(`[DB] Connected to database`);
    } else {
      console.error(`[DB] Failed to connect to database`);
    }
  }
}

export const db = new Database();
