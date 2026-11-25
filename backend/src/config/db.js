const { Pool, types } = require('pg');

types.setTypeParser(1082, (value) => value);

let pool;

function getPool() {
    if (!pool) {
        if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diisi di .env');
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: true,
            max: 3,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 15000,
        });
        pool.on('error', (err) => console.error('Koneksi database terputus:', err.message));
    }
    return pool;
}

const toPg = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
};

async function run(client, sql, params = []) {
    const isInsert = /^\s*insert\s/i.test(sql);
    const text = toPg(isInsert && !/returning/i.test(sql) ? `${sql} RETURNING id` : sql);
    const res = await client.query(text, params);
    if (res.command === 'SELECT') return [res.rows, res.fields];
    return [{ insertId: res.rows[0] ? res.rows[0].id : undefined, affectedRows: res.rowCount }, res.fields];
}

async function getConnection() {
    const client = await getPool().connect();
    return {
        query: (sql, params) => run(client, sql, params),
        beginTransaction: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK'),
        release: () => client.release(),
    };
}

module.exports = {
    query: (sql, params) => run(getPool(), sql, params),
    getConnection,
    raw: (sql) => getPool().query(sql),
    end: () => (pool ? pool.end() : Promise.resolve()),
};
