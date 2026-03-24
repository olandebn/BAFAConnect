import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
import dns from 'dns';
const { Pool } = pkg;

// 🔥 Désactive totalement IPv6 dans Node
dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL manquant dans les variables d\'environnement');
  process.exit(1);
}

// On extrait l'hôte IPv4 depuis l'URL
const host = connectionString.split('@')[1]?.split(':')[0];

console.log("Host forcé IPv4 :", host);

export const pool = new Pool({
  connectionString,
  host,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});
