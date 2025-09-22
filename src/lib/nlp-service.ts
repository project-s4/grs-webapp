// Simple NLP service for complaint categorization and department assignment
export class NLPService {
  // Keywords for different categories and departments
  private static readonly categoryKeywords = {
    'infrastructure': [
      'road', 'street', 'pothole', 'traffic', 'signal', 'bridge', 'construction', 
      'building', 'water', 'drainage', 'sewer', 'electricity', 'power', 'streetlight'
    ],
    'health': [
      'hospital', 'clinic', 'doctor', 'medicine', 'health', 'medical', 'ambulance', 
      'sanitation', 'garbage', 'waste', 'cleanliness', 'hygiene'
    ],
    'education': [
      'school', 'college', 'teacher', 'student', 'education', 'classroom', 'book', 
      'uniform', 'fee', 'admission', 'exam'
    ],
    'transport': [
      'bus', 'train', 'auto', 'taxi', 'vehicle', 'transport', 'traffic', 'parking', 
      'license', 'registration'
    ],
    'police': [
      'crime', 'theft', 'police', 'safety', 'security', 'violence', 'harassment', 
      'law', 'order', 'complaint'
    ],
    'fire': [
      'fire', 'emergency', 'rescue', 'smoke', 'burning', 'firefighter'
    ],
    'revenue': [
      'tax', 'property', 'registration', 'revenue', 'payment', 'bill', 'certificate', 
      'document'
    ],
    'environment': [
      'pollution', 'environment', 'tree', 'park', 'green', 'air', 'noise', 'water pollution'
    ]
  };

  private static readonly departmentMapping = {
    'infrastructure': 'Public Works',
    'health': 'Health Department', 
    'education': 'Education Department',
    'transport': 'Transport Department',
    'police': 'Police Department',
    'fire': 'Fire Department',
    'revenue': 'Revenue Department',
    'environment': 'Environment Department'
  };

  private static readonly priorityKeywords = {
    'urgent': [
      'emergency', 'urgent', 'critical', 'immediate', 'fire', 'accident', 'danger', 
      'life', 'death', 'serious', 'severe'
    ],
    'high': [
      'important', 'major', 'significant', 'blocking', 'affecting', 'multiple', 
      'community', 'public'
    ],
    'low': [
      'minor', 'small', 'suggestion', 'improvement', 'enhancement', 'cosmetic'
    ]
  };

  // Analyze complaint text and suggest category, department, and priority
  static analyzeComplaint(title: string, description: string): {
    category: string | null;
    suggestedDepartment: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    confidence: number;
  } {
    const text = `${title} ${description}`.toLowerCase();
    
    // Find best matching category
    let bestCategory = null;
    let bestScore = 0;
    
    Object.entries(this.categoryKeywords).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        score += matches;
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    
    // Check for urgent keywords
    if (this.priorityKeywords.urgent.some(keyword => text.includes(keyword))) {
      priority = 'urgent';
    } else if (this.priorityKeywords.high.some(keyword => text.includes(keyword))) {
      priority = 'high';
    } else if (this.priorityKeywords.low.some(keyword => text.includes(keyword))) {
      priority = 'low';
    }

    // Get suggested department
    const suggestedDepartment = bestCategory ? this.departmentMapping[bestCategory] : null;
    
    // Calculate confidence (0-1)
    const confidence = Math.min(bestScore / 5, 1); // Normalize to 0-1

    return {
      category: bestCategory,
      suggestedDepartment,
      priority,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  // Extract key information from complaint
  static extractKeyInfo(description: string): {
    location?: string;
    contact?: string;
    urgencyIndicators: string[];
  } {
    const urgencyIndicators = [];
    
    // Check for urgency indicators
    this.priorityKeywords.urgent.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        urgencyIndicators.push(keyword);
      }
    });

    // Simple location extraction (very basic)
    const locationMatches = description.match(/(?:at|near|in|on)\s+([^.!?,\n]+)/gi);
    const location = locationMatches ? locationMatches[0].replace(/^(at|near|in|on)\s+/i, '') : undefined;

    // Simple contact extraction
    const phoneMatch = description.match(/\b(\d{10}|\d{3}-\d{3}-\d{4})\b/);
    const contact = phoneMatch ? phoneMatch[0] : undefined;

    return {
      location: location?.trim(),
      contact,
      urgencyIndicators
    };
  }

  // Get category suggestions based on partial text
  static getCategorySuggestions(text: string, limit = 5): string[] {
    const lowerText = text.toLowerCase();
    const suggestions = new Set<string>();

    Object.entries(this.categoryKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (keyword.includes(lowerText) || lowerText.includes(keyword)) {
          suggestions.add(category);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Suggest department based on keywords
  static suggestDepartment(text: string): string | null {
    const analysis = this.analyzeComplaint('', text);
    return analysis.suggestedDepartment;
  }
}
