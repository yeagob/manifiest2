import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service for intelligent cause management
 * Uses Google Gemini to detect similar causes and prevent duplicates
 */
class AIService {
  constructor() {
    // Initialize Gemini AI with API key from environment
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not set. AI features will be disabled.');
      this.enabled = false;
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent results
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    this.enabled = true;
  }

  /**
   * Check if a proposed cause is similar to existing causes
   * @param {Object} proposedCause - The cause the user wants to create
   * @param {Array} existingCauses - All causes in the system
   * @returns {Promise<Object>} Analysis result with similarity information
   */
  async checkSimilarCause(proposedCause, existingCauses) {
    if (!this.enabled) {
      return {
        enabled: false,
        isSimilar: false,
        message: 'AI service not available'
      };
    }

    try {
      // Build the prompt for Gemini
      const prompt = this._buildSimilarityPrompt(proposedCause, existingCauses);

      // Get AI analysis
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const analysis = this._parseAIResponse(text);

      return {
        enabled: true,
        ...analysis
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        enabled: true,
        error: true,
        isSimilar: false,
        message: 'AI analysis failed. Creating cause anyway.'
      };
    }
  }

  /**
   * Build a detailed prompt for Gemini to analyze cause similarity
   * @private
   */
  _buildSimilarityPrompt(proposedCause, existingCauses) {
    const causesJSON = existingCauses.map(cause => ({
      id: cause.id,
      title: cause.title,
      description: cause.description,
      category: cause.category,
      supporters: cause.supporters?.length || 0,
      totalSteps: cause.totalSteps || 0
    }));

    return `You are an AI assistant helping to prevent duplicate causes in a protest simulator app.

**Your task:** Analyze if the proposed cause is similar to any existing causes.

**Proposed Cause:**
- Title: "${proposedCause.title}"
- Description: "${proposedCause.description}"
- Category: "${proposedCause.category}"

**Existing Causes (${causesJSON.length} total):**
${JSON.stringify(causesJSON, null, 2)}

**Analysis Instructions:**
1. Check for semantic similarity (same meaning, different words)
2. Check for topical overlap (same topic/issue)
3. Consider if combining efforts would be better than creating separate causes
4. If multiple similar causes exist, pick the MOST similar one

**Important:**
- Be strict: Only flag as similar if there's significant overlap (>70% similarity)
- Consider: Climate change ≈ Global warming ≈ Environmental crisis
- Consider: Black Lives Matter ≈ Racial justice ≈ Anti-racism
- Don't flag as similar if they're just in the same category but different issues
- Prefer existing causes with more supporters (they have momentum)

**Response Format (JSON only, no other text):**
{
  "isSimilar": boolean,
  "confidence": number (0-100),
  "matchedCauseId": "id or null",
  "matchedCauseTitle": "title or null",
  "reason": "Brief explanation in Spanish for the user",
  "suggestion": "What the user should do (in Spanish)"
}

**Examples:**

Example 1 - Similar:
Proposed: "Salvar los océanos"
Existing: "Protección de los mares y océanos"
Response: {
  "isSimilar": true,
  "confidence": 85,
  "matchedCauseId": "123",
  "matchedCauseTitle": "Protección de los mares y océanos",
  "reason": "Ambas causas buscan proteger los océanos y la vida marina",
  "suggestion": "Únete a la causa existente para sumar esfuerzos"
}

Example 2 - Not similar:
Proposed: "Educación gratuita universal"
Existing: "Lucha contra el cambio climático"
Response: {
  "isSimilar": false,
  "confidence": 0,
  "matchedCauseId": null,
  "matchedCauseTitle": null,
  "reason": "No se encontraron causas similares",
  "suggestion": "Crea tu causa y empieza a caminar por ella"
}

Now analyze the proposed cause and respond with JSON only:`;
  }

  /**
   * Parse and validate AI response
   * @private
   */
  _parseAIResponse(text) {
    try {
      // Remove markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (typeof parsed.isSimilar !== 'boolean') {
        throw new Error('Invalid isSimilar field');
      }

      return {
        isSimilar: parsed.isSimilar,
        confidence: parsed.confidence || 0,
        matchedCauseId: parsed.matchedCauseId || null,
        matchedCauseTitle: parsed.matchedCauseTitle || null,
        reason: parsed.reason || 'No reason provided',
        suggestion: parsed.suggestion || 'Continúa creando tu causa'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', text);

      // Fallback: assume not similar if parsing fails
      return {
        isSimilar: false,
        confidence: 0,
        matchedCauseId: null,
        matchedCauseTitle: null,
        reason: 'No se pudo analizar la similitud',
        suggestion: 'Crea tu causa'
      };
    }
  }
}

// Export singleton instance
export default new AIService();
