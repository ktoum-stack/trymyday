
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateProducts() {
    try {
        const dataPath = path.join(__dirname, 'backend', 'data', 'products.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const productsData = JSON.parse(rawData).products;

        console.log(`Trouvé ${productsData.length} produits. Migration en cours...`);

        // Insert products one by one or in batch
        const { data, error } = await supabase
            .from('products')
            .upsert(productsData);

        if (error) {
            console.error("Erreur lors de la migration:", error);
        } else {
            console.log("Migration des produits terminée avec succès !");
        }
    } catch (error) {
        console.error("Erreur fatale:", error);
    }
}

migrateProducts();
