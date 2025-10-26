const EventEmitter = require('events');
const axios = require('axios');

class RAGHintService extends EventEmitter {
  constructor(ragServiceUrl = 'http://127.0.0.1:5001') {
    super();
    this.ragServiceUrl = ragServiceUrl;
    this.isConnected = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${this.ragServiceUrl}/health`, {
        timeout: 3000
      });
      this.isConnected = response.data.status === 'healthy';
      this.mode = response.data.mode || 'unknown';
      this.emit('connection', this.isConnected);
      console.log(`🤖 RAG Service: ${this.isConnected ? 'Connected' : 'Disconnected'} (${this.mode} mode)`);
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      this.emit('connection', false);
      console.log('⚠️  RAG Service: Disconnected');
      return false;
    }
  }

  async generateHints(code, options = {}) {
    try {
      const {
        topic = null,
        num_hints = 3,
        personality = 'mentor',
        hint_level = 1
      } = options;

      const response = await axios.post(
        `${this.ragServiceUrl}/api/hints/generate`,
        {
          code,
          topic,
          num_hints,
          personality,
          hint_level
        },
        {
          timeout: 20000,  // Increased timeout for multiple hint generation
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        this.emit('hints-generated', response.data);
        return {
          success: true,
          topic: response.data.topic,
          personality: response.data.personality,
          knowledgeBaseHints: response.data.knowledge_base_hints || [],
          progressiveHints: response.data.progressive_hints || [],
          currentLevel: response.data.current_level || 1,
          mode: response.data.mode,
          source: 'rag'
        };
      } else {
        throw new Error('RAG service returned unsuccessful response');
      }

    } catch (error) {
      console.error('RAG Hint Service error:', error.message);
      this.emit('error', error);
      
      // Return fallback hints
      return {
        success: false,
        progressiveHints: [
          { level: 1, hint: "Break the problem into smaller steps.", revealed: true },
          { level: 2, hint: "What data structures might help here?", revealed: false },
          { level: 3, hint: "Consider the time complexity you need.", revealed: false }
        ],
        currentLevel: 1,
        error: error.message,
        source: 'fallback'
      };
    }
  }

  async getAvailableTopics() {
    try {
      const response = await axios.get(`${this.ragServiceUrl}/api/hints/topics`, {
        timeout: 5000
      });
      return response.data.topics || [];
    } catch (error) {
      console.error('Failed to fetch topics:', error.message);
      return [];
    }
  }

  async getTopicHints(topic) {
    try {
      const response = await axios.get(`${this.ragServiceUrl}/api/hints/topic/${topic}`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch topic hints:', error.message);
      return null;
    }
  }

  getFallbackHints(code) {
    // Simple fallback hints based on code analysis
    const hints = [];
    
    if (code.includes('for') || code.includes('while')) {
      hints.push('Think about loop termination conditions.');
    }
    
    if (code.includes('if') || code.includes('else')) {
      hints.push('Consider all possible conditional branches.');
    }
    
    if (code.includes('function') || code.includes('def')) {
      hints.push('What should this function return?');
    }
    
    if (hints.length === 0) {
      hints.push('Break down the problem into smaller steps.');
      hints.push('Consider edge cases in your solution.');
    }
    
    return hints;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      mode: this.mode,
      url: this.ragServiceUrl
    };
  }
}

module.exports = RAGHintService;

