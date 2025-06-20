import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Star, CheckCircle, AlertCircle, MessageSquare, 
  Flag, Clock, User, Mail, FileText, Save, Loader,
  RefreshCw, Search, ExternalLink, Heart
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { feedbackService, FeedbackSubmission } from '../services/feedback';

interface FormData {
  feedbackType: string;
  priorityLevel: string;
  title: string;
  description: string;
  rating: number;
  pollResponse: string;
  contactEmail: string;
  contactName: string;
}

const FEEDBACK_TYPES = [
  { value: 'bug-report', label: 'Bug Report', icon: '🐛' },
  { value: 'feature-suggestion', label: 'Feature Suggestion', icon: '💡' },
  { value: 'general-comment', label: 'General Comment', icon: '💬' },
  { value: 'content-feedback', label: 'Content Feedback', icon: '📚' },
  { value: 'ui-ux-feedback', label: 'UI/UX Feedback', icon: '🎨' },
  { value: 'performance-issue', label: 'Performance Issue', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '📝' }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800', description: 'Minor issue or suggestion' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800', description: 'Noticeable issue affecting experience' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', description: 'Critical issue requiring immediate attention' }
];

const POLL_QUESTION = "How would you rate your overall experience with our platform?";
const POLL_OPTIONS = [
  'Excellent - Exceeded expectations',
  'Good - Met expectations', 
  'Fair - Some room for improvement',
  'Poor - Needs significant improvement'
];

const MIN_DESCRIPTION_LENGTH = 20;
const DRAFT_STORAGE_KEY = 'feedback_draft';

function Contact() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    feedbackType: '',
    priorityLevel: '',
    title: '',
    description: '',
    rating: 0,
    pollResponse: '',
    contactEmail: user?.email || '',
    contactName: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Auto-save draft functionality
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(prev => ({
          ...prev,
          ...draft,
          contactEmail: user?.email || draft.contactEmail || ''
        }));
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [user]);

  // Auto-save draft when form data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.description) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  // Update email when user changes
  useEffect(() => {
    if (user?.email && !formData.contactEmail) {
      setFormData(prev => ({ ...prev, contactEmail: user.email || '' }));
    }
  }, [user, formData.contactEmail]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.feedbackType) {
      newErrors.feedbackType = 'Please select a feedback type';
    }

    if (!formData.priorityLevel) {
      newErrors.priorityLevel = 'Please select a priority level';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }

    if (formData.rating === 0) {
      newErrors.rating = 'Please provide a rating';
    }

    if (formData.contactEmail && !formData.contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const submission: FeedbackSubmission = {
        feedbackType: formData.feedbackType,
        priorityLevel: formData.priorityLevel,
        title: formData.title,
        description: formData.description,
        rating: formData.rating,
        pollResponse: formData.pollResponse || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactName: formData.contactName || undefined
      };

      const result = await feedbackService.submitFeedback(submission);
      
      setReferenceNumber(result.referenceNumber);
      setSubmitStatus('success');
      setSubmitMessage('Thank you for your feedback! We\'ve received your submission and will review it shortly.');
      
      // Clear form and draft
      setFormData({
        feedbackType: '',
        priorityLevel: '',
        title: '',
        description: '',
        rating: 0,
        pollResponse: '',
        contactEmail: user?.email || '',
        contactName: ''
      });
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData({
      feedbackType: '',
      priorityLevel: '',
      title: '',
      description: '',
      rating: 0,
      pollResponse: '',
      contactEmail: user?.email || '',
      contactName: ''
    });
    setErrors({});
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleInputChange('rating', star)}
            className={`p-1 transition-colors ${
              star <= formData.rating
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star className={`h-8 w-8 ${star <= formData.rating ? 'fill-current' : ''}`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {formData.rating > 0 ? `${formData.rating}/5 stars` : 'Click to rate'}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact & Feedback</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us improve by sharing your thoughts, reporting issues, or suggesting new features. 
            Your feedback drives our development priorities.
          </p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {submitStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Feedback Submitted Successfully!
                  </h3>
                  <p className="text-green-700 mb-3">{submitMessage}</p>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">
                      Reference Number: <span className="font-mono">{referenceNumber}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Save this reference number to track your feedback status
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {submitStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Submission Failed
                  </h3>
                  <p className="text-red-700">{submitMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Form Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-6 w-6 mr-3" />
                <h2 className="text-2xl font-bold">Submit Feedback</h2>
              </div>
              {isDraftSaved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center text-orange-100"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <span className="text-sm">Draft saved</span>
                </motion.div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Feedback Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('feedbackType', type.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.feedbackType === type.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              {errors.feedbackType && (
                <p className="mt-2 text-sm text-red-600">{errors.feedbackType}</p>
              )}
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRIORITY_LEVELS.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => handleInputChange('priorityLevel', priority.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.priorityLevel === priority.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priority.color}`}>
                        {priority.label}
                      </span>
                      <Flag className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">{priority.description}</p>
                  </button>
                ))}
              </div>
              {errors.priorityLevel && (
                <p className="mt-2 text-sm text-red-600">{errors.priorityLevel}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Brief summary of your feedback"
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.title.length}/100 characters
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Please provide detailed information about your feedback. Include steps to reproduce for bugs, specific use cases for features, or any other relevant details."
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
                <p className={`text-sm ml-auto ${
                  formData.description.length < MIN_DESCRIPTION_LENGTH 
                    ? 'text-red-500' 
                    : 'text-gray-500'
                }`}>
                  {formData.description.length}/2000 characters 
                  {formData.description.length < MIN_DESCRIPTION_LENGTH && 
                    ` (minimum ${MIN_DESCRIPTION_LENGTH})`
                  }
                </p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Rating *
              </label>
              <div className="bg-gray-50 p-4 rounded-xl">
                {renderStarRating()}
                {errors.rating && (
                  <p className="mt-2 text-sm text-red-600">{errors.rating}</p>
                )}
              </div>
            </div>

            {/* Quick Poll */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Poll (Optional)
              </label>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-700 mb-3 font-medium">{POLL_QUESTION}</p>
                <div className="space-y-2">
                  {POLL_OPTIONS.map((option, index) => (
                    <label key={index} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="pollResponse"
                        value={option}
                        checked={formData.pollResponse === option}
                        onChange={(e) => handleInputChange('pollResponse', e.target.value)}
                        className="mr-3 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information (Optional)
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Provide your contact details if you'd like us to follow up on your feedback. 
                You can also submit anonymous feedback by leaving these fields empty.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.contactEmail ? 'border-red-300' : 'border-blue-200'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={clearDraft}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw className="h-5 w-5 mr-2 inline" />
                Clear Form
              </button>
            </div>
          </form>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Response Time */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Response Time</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-red-600">Urgent:</span> Within 24 hours</p>
              <p><span className="font-medium text-yellow-600">Moderate:</span> Within 3-5 business days</p>
              <p><span className="font-medium text-green-600">Low:</span> Within 1-2 weeks</p>
            </div>
          </div>

          {/* Alternative Contact */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Direct Contact</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              For urgent issues or direct communication, you can also reach us at:
            </p>
            <a 
              href="mailto:support@aibitcointutor.com"
              className="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium"
            >
              support@aibitcointutor.com
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
        </motion.div>

        {/* Thank You Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md border border-orange-100">
            <Heart className="h-5 w-5 text-orange-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Thank you for helping us improve AI Bitcoin Tutor!
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Contact;