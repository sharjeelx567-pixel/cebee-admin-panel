/**
 * FAQ Service
 * Handles all FAQ-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './apiBase';

// Base endpoint for FAQ operations
// Following the pattern: CRUD operations use '/faqs', specific admin operations use '/admin/'
const FAQ_ENDPOINT = '/faqs';

/**
 * Get all FAQs with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (status, category, search, page, limit, sort_by, sort_order)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFaqs = async (params = {}) => {
  try {
    const response = await apiGet(FAQ_ENDPOINT, params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { faqs: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch FAQs',
      data: { faqs: [], pagination: {} },
    };
  }
};

/**
 * Get FAQ by ID
 * @param {string} faqId - FAQ ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFaqById = async (faqId) => {
  try {
    if (!faqId) {
      return {
        success: false,
        error: 'FAQ ID is required',
      };
    }

    const response = await apiGet(`${FAQ_ENDPOINT}/${faqId}`);
    
    if (response.success) {
      // Backend returns { success: true, data: { faq: {...} } }
      const faq = response.data?.faq || response.data;
      
      // Map backend fields to frontend format
      return {
        success: true,
        data: {
          question: faq.question || faq.title || '',
          answer: faq.answer || faq.content || '',
          category: faq.category || 'Getting Started',
          status: faq.status ? faq.status.toLowerCase() : (faq.isActive ? 'published' : 'draft'),
          order: faq.order || 0,
          _id: faq._id || faqId,
        },
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch FAQ',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch FAQ details',
    };
  }
};

/**
 * Create new FAQ
 * @param {object} faqData - FAQ data (question, answer, category, status, order)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createFaq = async (faqData) => {
  try {
    if (!faqData.question || !faqData.answer) {
      return {
        success: false,
        error: 'Question and answer are required',
      };
    }

    const response = await apiPost(FAQ_ENDPOINT, faqData);
    
    if (response.success) {
      // Backend returns { success: true, data: { faq: {...} } }
      const faq = response.data?.faq || response.data;
      return {
        success: true,
        data: faq,
        message: response.message || 'FAQ created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create FAQ',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating FAQ',
    };
  }
};

/**
 * Update FAQ
 * @param {string} faqId - FAQ ID
 * @param {object} faqData - Updated FAQ data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateFaq = async (faqId, faqData) => {
  try {
    if (!faqId) {
      return {
        success: false,
        error: 'FAQ ID is required',
      };
    }

    const response = await apiPut(`${FAQ_ENDPOINT}/${faqId}`, faqData);
    
    if (response.success) {
      // Backend returns { success: true, data: { faq: {...} } }
      const faq = response.data?.faq || response.data;
      return {
        success: true,
        data: faq,
        message: response.message || 'FAQ updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update FAQ',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating FAQ',
    };
  }
};

/**
 * Delete FAQ
 * @param {string} faqId - FAQ ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deleteFaq = async (faqId) => {
  try {
    if (!faqId) {
      return {
        success: false,
        error: 'FAQ ID is required',
      };
    }

    const response = await apiDelete(`${FAQ_ENDPOINT}/${faqId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'FAQ deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete FAQ',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting FAQ',
    };
  }
};

/**
 * Update FAQ status
 * @param {string} faqId - FAQ ID
 * @param {string} status - New status (draft, published, archived)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateFaqStatus = async (faqId, status) => {
  try {
    if (!faqId) {
      return {
        success: false,
        error: 'FAQ ID is required',
      };
    }

    if (!status) {
      return {
        success: false,
        error: 'Status is required',
      };
    }

    const response = await apiPatch(`${FAQ_ENDPOINT}/${faqId}/status`, { status });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'FAQ status updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update FAQ status',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating FAQ status',
    };
  }
};
