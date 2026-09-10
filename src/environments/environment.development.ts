import { environmentBase } from './environment.base';

export const environment = {
  ...environmentBase,
  appVersion: `${environmentBase.appVersion}-dev`,

  production: false,
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
};