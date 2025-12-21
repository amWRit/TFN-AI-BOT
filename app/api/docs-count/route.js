import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const combinedPath = path.join(process.cwd(), 'public', 'json', 'combined_data.json');
    
    const data = await fs.readFile(combinedPath, 'utf8');
    const combined = JSON.parse(data);
    
    // EXACT same logic as your Python json_to_documents()
    let totalDocs = 0;
    
    // Count structured/scraped sections
    for (const section in combined) {
      if (section === 'unstructured_chunks') {
        totalDocs += combined[section]?.length || 0;
      } else if (Array.isArray(combined[section])) {
        totalDocs += combined[section].length;
      }
    }
    
    return Response.json({ 
      total: totalDocs,
      message: `${totalDocs} documents ready (scraped + structured + unstructured)`
    });
  } catch (error) {
    console.error('Docs count error:', error);
    return Response.json({ total: 0, message: 'No index found' });
  }
}
