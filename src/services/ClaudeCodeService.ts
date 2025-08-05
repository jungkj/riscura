import { Claude } from '@anthropic-ai/claude-code';

export class ClaudeCodeService {
  private claude: Claude;

  constructor() {
    this.claude = new Claude({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  /**
   * Analyze code for potential issues
   */
  async analyzeCode(code: string, language: string = 'typescript') {
    try {
      const response = await this.claude.complete({
        prompt: `Please analyze this ${language} code and identify potential issues, improvements, and best practices:

\`\`\`${language}
${code}
\`\`\`

Please provide:
1. Security vulnerabilities
2. Performance improvements
3. Code quality suggestions
4. Best practice recommendations`,
        max_tokens: 2000,
        temperature: 0.1,
      });

      return {
        success: true,
        analysis: response.completion,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate code based on requirements
   */
  async generateCode(requirements: string, language: string = 'typescript') {
    try {
      const response = await this.claude.complete({
        prompt: `Generate ${language} code based on these requirements:

${requirements}

Please provide:
1. Clean, well-commented code
2. Error handling
3. Type definitions (if applicable)
4. Usage examples`,
        max_tokens: 3000,
        temperature: 0.2,
      });

      return {
        success: true,
        code: response.completion,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Code generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Explain code functionality
   */
  async explainCode(code: string, language: string = 'typescript') {
    try {
      const response = await this.claude.complete({
        prompt: `Please explain what this ${language} code does in detail:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. High-level overview
2. Step-by-step breakdown
3. Input/output description
4. Dependencies and requirements`,
        max_tokens: 2000,
        temperature: 0.1,
      });

      return {
        success: true,
        explanation: response.completion,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Code explanation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Refactor code for better structure
   */
  async refactorCode(code: string, language: string = 'typescript', goals: string[] = []) {
    const goalsText = goals.length > 0 ? `Focus on: ${goals.join(', ')}` : '';
    
    try {
      const response = await this.claude.complete({
        prompt: `Please refactor this ${language} code to improve its structure and maintainability:

\`\`\`${language}
${code}
\`\`\`

${goalsText}

Provide:
1. Refactored code with improvements
2. Explanation of changes made
3. Benefits of the refactoring
4. Any breaking changes to note`,
        max_tokens: 3000,
        temperature: 0.2,
      });

      return {
        success: true,
        refactoredCode: response.completion,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Code refactoring failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}

export const claudeCodeService = new ClaudeCodeService(); 