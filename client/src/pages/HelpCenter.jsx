import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Phone, MessageSquare, BookOpen, AlertCircle, CreditCard, User, Briefcase } from 'lucide-react';

const scenarios = [
  {
    category: "Getting Started",
    icon: <User className="w-5 h-5" />,
    items: [
      {
        question: "How do I create an account?",
        answer: "Click the 'Register' button on the homepage. Select whether you are a 'Customer' looking to hire or a 'Worker' looking for jobs. Fill in your details and verify your email to get started."
      },
      {
        question: "Is there a fee to join WorkLink?",
        answer: "Signing up is completely free! We only charge a small platform fee when a job is successfully completed and paid for."
      },
      {
        question: "How do I verify my identity?",
        answer: "Go to your Profile page and look for the 'Verification' badge. Upload a government-issued ID (like Aadhaar or Driver's License) to get the Verified badge, which increases trust."
      }
    ]
  },
  {
    category: "Posting & Finding Jobs",
    icon: <Briefcase className="w-5 h-5" />,
    items: [
      {
        question: "How do I post a job?",
        answer: "Click 'Post a Job' in the navigation bar. Provide a clear title, description, location, and budget. The more details you provide, the better matches you will get."
      },
      {
        question: "How do I accept a job assignment?",
        answer: "When a customer assigns you a job, go to 'My Jobs'. You will see a timer and an 'Accept Work' button. Click it before the timer expires to secure the job."
      },
      {
        question: "Can I cancel a job after accepting?",
        answer: "Yes, but repeated cancellations may affect your worker rating. Go to the Job Details page and select 'Cancel Job'. Please provide a valid reason."
      },
      {
        question: "My job posting isn't getting any applicants.",
        answer: "Try increasing the budget or adding more details to the description. Ensure your location is accurate. You can also edit the job to make it more attractive."
      }
    ]
  },
  {
    category: "Payments & Financials",
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      {
        question: "When do I get paid?",
        answer: "Payment is released immediately after the customer marks the job as 'Completed' and pays through the app. The funds will appear in your connected bank account within 24-48 hours."
      },
      {
        question: "What payment methods are supported?",
        answer: "We support Credit/Debit Cards, UPI, and Net Banking. All payments are secured via Stripe/Razorpay."
      },
      {
        question: "Why was my payment declined?",
        answer: "Check if your card has sufficient funds or if your bank is blocking the transaction. Ensure your internet connection is stable. If the issue persists, contact your bank."
      },
      {
        question: "How are platform fees calculated?",
        answer: "WorkLink deducts a flat 10% fee from the total job amount to cover platform maintenance, insurance, and support services."
      }
    ]
  },
  {
    category: "Safety & Disputes",
    icon: <AlertCircle className="w-5 h-5" />,
    items: [
      {
        question: "What if the worker doesn't show up?",
        answer: "If a worker doesn't start travel or arrive within the expected time, you can cancel the job and repost it. Please report the worker via the 'Report' button on their profile."
      },
      {
        question: "What if the customer refuses to pay?",
        answer: "If you have completed the work and uploaded proof (photos/videos), use the 'Raise Dispute' button on the Job Details page. Our support team will review the evidence and ensure you get paid."
      },
      {
        question: "Is my personal number shared?",
        answer: "No. WorkLink uses a secure privacy-preserving call feature. When you call a user, your real number is masked."
      },
      {
        question: "How do I report inappropriate behavior?",
        answer: "Go to the user's profile or the specific job chat, click the three dots menu, and select 'Report User'. We take safety violations very seriously."
      }
    ]
  },
  {
    category: "App Usage",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      {
        question: "How do I change my language?",
        answer: "Go to Profile > Settings > Language Preference. We currently support English, and are adding regional languages soon."
      },
      {
        question: "The map isn't loading.",
        answer: "Please ensure you have granted location permissions to the WorkLink app in your browser settings. Refresh the page and try again."
      }
    ]
  }
];

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredScenarios = scenarios.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How can we help you?
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Search our knowledge base or browse categories below.
          </p>
          <div className="mt-6 max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm"
              placeholder="Search for answers (e.g., 'payment', 'cancel job')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredScenarios.map((category, catIndex) => (
            <div key={catIndex} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-center">
                <div className="mr-3 p-2 bg-white rounded-full shadow-sm text-primary-600">
                  {category.icon}
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {category.category}
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {category.items.map((item, itemIndex) => {
                  const isOpen = openItems[`${catIndex}-${itemIndex}`];
                  return (
                    <li key={itemIndex} className="bg-white">
                      <button
                        onClick={() => toggleItem(catIndex, itemIndex)}
                        className="w-full text-left px-4 py-4 sm:px-6 hover:bg-gray-50 focus:outline-none transition-colors duration-150 ease-in-out"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 pr-4">
                            {item.question}
                          </p>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        {isOpen && (
                          <div className="mt-3 text-sm text-gray-500 animate-fadeIn">
                             {item.answer}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {filteredScenarios.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No results found for "{searchTerm}".</p>
            </div>
          )}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            If you couldn't find the answer you were looking for, our support team is here to assist you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat with Support
            </button>
            <button className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm">
              <Phone className="w-5 h-5 mr-2" />
              Request a Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
