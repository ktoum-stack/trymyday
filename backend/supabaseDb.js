const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://kzuwztsjmwzqmjqdxwra.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_yTdhpvUMZEIlEn-bDtAUJQ_C6Md7zQh';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getFileData(filename, defaultString = '{}') {
    try {
        const { data, error } = await supabase.from('json_store').select('data').eq('filename', filename).single();
        if (error || !data) {
            // Fallback: try reading local file if it's the first time
            const fs = require('fs').promises;
            const path = require('path');
            try {
                const localData = await fs.readFile(path.join(__dirname, 'data', filename), 'utf8');
                // Upload it to Supabase so it's saved for next time
                await saveFileData(filename, localData);
                return localData;
            } catch (e) {
                return defaultString;
            }
        }
        return JSON.stringify(data.data);
    } catch (e) {
        return defaultString;
    }
}

async function saveFileData(filename, fileString) {
    try {
        const jsonObject = JSON.parse(fileString);
        await supabase.from('json_store').upsert({ filename, data: jsonObject });
    } catch (e) {
        console.error("Error saving to Supabase:", e);
    }
}

module.exports = { getFileData, saveFileData };
