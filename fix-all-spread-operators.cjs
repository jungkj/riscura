const fs = require('fs');
const path = require('path');

// Pattern to find service method calls with spread operators
const serviceCallPattern = /await\s+(\w+Service)\.(create|assess|update)\w*\(\s*\{[^}]*\.\.\.validatedData[^}]*\}\s*\)/gs;

function findAndFixSpreadOperators(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Find all matches
  const matches = [...content.matchAll(serviceCallPattern)];
  
  if (matches.length > 0) {
    console.log(`\nFound ${matches.length} potential issues in ${filePath}`);
    
    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const serviceName = match[1];
      const methodType = match[2];
      
      console.log(`  ${index + 1}. ${serviceName}.${methodType}... with spread operator`);
      
      // Extract the method call to analyze it
      const startIndex = match.index;
      let bracketCount = 0;
      let endIndex = startIndex;
      let foundStart = false;
      
      // Find the complete method call
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') {
          bracketCount++;
          foundStart = true;
        } else if (content[i] === '}' && foundStart) {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i + 1;
            
            // Look for closing parenthesis
            for (let j = i + 1; j < content.length && j < i + 10; j++) {
              if (content[j] === ')') {
                endIndex = j + 1;
                break;
              }
            }
            break;
          }
        }
      }
      
      const methodCall = content.substring(startIndex, endIndex);
      console.log(`     Original: ${methodCall.split('\n')[0]}...`);
      
      // For now, just log the issues - manual fix needed for each case
      // as we need to know the exact fields required by each method
    });
    
    modified = true;
  }
  
  return modified;
}

function scanAllApiRoutes() {
  const apiDir = path.join(__dirname, 'src', 'app', 'api');
  const issueFiles = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (findAndFixSpreadOperators(filePath)) {
          issueFiles.push(filePath);
        }
      }
    }
  }
  
  console.log('Scanning for spread operator issues in service calls...');
  walkDir(apiDir);
  
  console.log(`\n\nSummary: Found issues in ${issueFiles.length} files:`);
  issueFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  // Now let's check the specific file that's failing
  console.log('\n\nChecking the current build error file:');
  const assessmentFile = path.join(__dirname, 'src', 'app', 'api', 'compliance', 'assessments', 'route.ts');
  const content = fs.readFileSync(assessmentFile, 'utf8');
  
  // Find the createAssessment call
  const createAssessmentMatch = content.match(/const assessment = await complianceService\.createAssessment\(\{[\s\S]*?\}\);/);
  if (createAssessmentMatch) {
    console.log('\nFound createAssessment call:');
    console.log(createAssessmentMatch[0]);
    
    // Check the schema
    const schemaMatch = content.match(/const createAssessmentSchema = z\.object\(\{[\s\S]*?\}\);/);
    if (schemaMatch) {
      console.log('\nSchema definition:');
      console.log(schemaMatch[0]);
    }
  }
}

scanAllApiRoutes();