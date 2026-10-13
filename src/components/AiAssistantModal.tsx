import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  FileText,
  Copy,
  Share2,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Printer,
  AlertCircle,
  Edit3,
  Wallet,
} from 'lucide-react';
import {
  AiAction,
  AiMessage,
  BillInvoice,
  CashEntry,
  Customer,
  InventoryItem,
  KhataTransaction,
  StoreSettings,
  AppTab,
} from '../types';
import { processAiCommand, PendingBillDraft } from '../ai/aiEngine';
import {
  isClothingOrKidsItem,
  COMMON_KIDS_SIZES,
} from '../utils/clothingUtils';

interface AiAssistantModalProps {
  storeSettings: StoreSettings;
  customers: Customer[];
  transactions: KhataTransaction[];
  inventory: InventoryItem[];
  invoices: BillInvoice[];
  cashbook: CashEntry[];
  onDismiss: () => void;
  onExecuteAction: (action: AiAction) => void;
  onViewInvoice: (invoice: BillInvoice) => void;
  onNavigateTab: (tab: AppTab) => void;
  onTriggerReminder: (customerId: string) => void;
  onOpenPdfStatement: (action: AiAction) => void;
}

// Window declaration for SpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  storeSettings,
  customers,
  transactions,
  inventory,
  invoices,
  cashbook,
  onDismiss,
  onExecuteAction,
  onViewInvoice,
  onNavigateTab,
  onTriggerReminder,
  onOpenPdfStatement,
}) => {
  // Concise, professional default greeting with zero auto-voice readout
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome_1',
      sender: 'AI',
      text: 'Ready. What do you need to record?',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const [pendingBillDraft, setPendingBillDraft] = useState<PendingBillDraft | null>(null);
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [draftSizes, setDraftSizes] = useState<Record<string, string>>({});
  const [completedBills, setCompletedBills] = useState<Set<string>>(new Set());

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Accepts Hinglish, Hindi and English
      recognition.onstart = () => {
        setIsListening(true);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Explicit voice input -> AI voice response permitted
          handleSendMessage(transcript, true);
        }
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeaking();
    };
  }, []);

  // Text-To-Speech (Triggered ONLY on explicit speaker icon click or mic voice input)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean text of markdown stars and emojis for clear speech
    const clean = text
      .replace(/[*#_~]/g, '')
      .replace(/[•]/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick Hindi or Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang.includes('hi') || v.lang.includes('IN')
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert(
        'Speech recognition is not supported on this browser. You can type queries in Hinglish/Hindi directly in the text box below!'
      );
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendMessage = (userText: string, isVoiceOrigin: boolean = false) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    const userMsg: AiMessage = {
      id: `u_${Date.now()}`,
      sender: 'USER',
      text: trimmed,
      timestamp: Date.now(),
    };

    const { response, action } = processAiCommand(
      trimmed,
      storeSettings,
      customers,
      transactions,
      inventory,
      invoices,
      cashbook,
      pendingBillDraft
    );

    const aiMsg: AiMessage = {
      id: `ai_${Date.now()}`,
      sender: 'AI',
      text: response,
      action,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputText('');

    // Pre-populate input box for VERIFY_BILL if description was extracted
    if (action?.actionType === 'VERIFY_BILL' && action.extractedDescription) {
      setDraftInputs((prev) => ({
        ...prev,
        [aiMsg.id]: action.extractedDescription || '',
      }));
    }

    // Speak aloud ONLY IF query came via spoken mic input!
    if (isVoiceOrigin) {
      speakText(response);
    }

    // Execute identified action live
    if (action) {
      if (action.actionType === 'NAVIGATE' && action.targetTab) {
        onNavigateTab(action.targetTab);
      } else if (action.actionType === 'OPEN_PDF_STATEMENT') {
        onOpenPdfStatement(action);
      } else if (action.actionType === 'CREATE_BILL') {
        setPendingBillDraft(null);
        onExecuteAction(action);
        if (action.invoice) {
          onViewInvoice(action.invoice);
        }
      } else if (action.actionType === 'VERIFY_BILL') {
        setPendingBillDraft({
          customerName: action.customerName || 'Counter Customer',
          customerId: action.invoice?.customerId || null,
          customerPhone: action.customerPhone || '+91 98000 00000',
          amount: action.amount || 0,
          extractedDescription: action.extractedDescription || '',
          needsDescription: !!action.needsDescription,
          needsVerification: !!action.needsVerification,
        });
      } else {
        onExecuteAction(action);
      }
    }
  };

  const handleConfirmBillFromCard = (
    msgId: string,
    customerName: string,
    amount: number,
    description: string,
    draftInv?: BillInvoice,
    customSize?: string
  ) => {
    const finalDesc = description.trim();
    if (!finalDesc) return;

    const isCloth = isClothingOrKidsItem(finalDesc);
    const finalSize = isCloth ? (customSize?.trim() || '2-4 Yrs') : '';
    const newInvNumber = `GKW-${1050 + invoices.length + 1}`;

    const targetCust = customers.find(
      (c) => c.name.toLowerCase() === customerName.toLowerCase()
    );

    const invoice: BillInvoice = draftInv
      ? {
          ...draftInv,
          items: [
            {
              itemId: targetCust ? `item_${Date.now()}` : '',
              itemName: finalDesc,
              size: finalSize,
              quantity: 1,
              unitPrice: amount,
            },
          ],
          optionalNotes: '',
          privateNote: '',
        }
      : {
          invoiceId: `inv_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          invoiceNumber: newInvNumber,
          customerId: targetCust ? targetCust.id : null,
          customerName,
          customerPhone: targetCust ? targetCust.phone : '+91 98000 00000',
          items: [
            {
              itemId: targetCust ? `item_${Date.now()}` : '',
              itemName: finalDesc,
              size: finalSize,
              quantity: 1,
              unitPrice: amount,
            },
          ],
          subtotal: amount,
          discountAmount: 0.0,
          additionalCharges: 0.0,
          gstPercent: 0.0,
          gstAmount: 0.0,
          netTotal: amount,
          paymentMode: targetCust ? 'CREDIT' : 'CASH',
          gstinNumber: '24AAACG1234F1Z5',
          stateOfSupply: 'Gujarat (24)',
          optionalNotes: '',
          privateNote: '',
          designTheme: storeSettings.activeInvoiceTheme,
          timestamp: Date.now(),
          engineerName: 'Kirio Ken',
        };

    onExecuteAction({ actionType: 'CREATE_BILL', invoice });
    onViewInvoice(invoice);
    setPendingBillDraft(null);
    setCompletedBills((prev) => new Set(prev).add(msgId));

    const confirmationMsg: AiMessage = {
      id: `ai_${Date.now()}`,
      sender: 'AI',
      text: `✅ *BILL GENERATED:*\n🧾 Invoice No: *${invoice.invoiceNumber}*\n👤 Customer: *${customerName}*\n📦 Item: *${finalDesc}*${finalSize ? ` (Size: ${finalSize})` : ''}\n💰 Net Total: *₹${amount.toFixed(0)}*\n\nBill receipt screen par preview kar di gayi hai!`,
      action: { actionType: 'CREATE_BILL', invoice },
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, confirmationMsg]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReportId(id);
    setTimeout(() => setCopiedReportId(null), 2500);
  };

  const shareReportWhatsApp = (reportText: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-[90vh] max-h-[750px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="p-4 md:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Ghanshyam AI Voice Manager
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Full Store Write Access
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Kirio Ken Edition • Understands Hinglish & Hindi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-xs flex items-center gap-1 font-bold cursor-pointer"
                title="Mute voice"
              >
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">Mute</span>
              </button>
            )}
            <button
              onClick={() => {
                stopSpeaking();
                onDismiss();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat message body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/60 no-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none font-normal'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span
                      className={`text-[10px] font-extrabold tracking-wider uppercase ${
                        isUser ? 'text-indigo-200' : 'text-indigo-600'
                      }`}
                    >
                      {isUser ? 'You (Store Owner)' : 'Ghanshyam AI Store Manager'}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        title="Click speaker icon to play voice"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="whitespace-pre-line leading-relaxed text-xs md:text-sm">
                    {msg.text}
                  </p>

                  {/* Attached Action Execution Card */}
                  {msg.action && !isUser && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {/* 1. REPORT ACTION */}
                      {msg.action.actionType === 'REPORT' && msg.action.reportText && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              Store Report Ready
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Verified
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                copyToClipboard(msg.action!.reportText!, msg.id)
                              }
                              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>
                                {copiedReportId === msg.id ? 'Copied!' : 'Copy Report'}
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                shareReportWhatsApp(msg.action!.reportText!)
                              }
                              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. OPEN PDF STATEMENT ACTION */}
                      {msg.action.actionType === 'OPEN_PDF_STATEMENT' && (
                        <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              {msg.action.pdfReportTitle || 'PDF Statement Ready'}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-600 text-white">
                              PDF Format
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (onOpenPdfStatement && msg.action) {
                                  onOpenPdfStatement(msg.action);
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View & Print PDF Statement</span>
                            </button>
                            <button
                              onClick={() =>
                                shareReportWhatsApp(
                                  `*STATEMENT PDF - ${storeSettings.storeName}*\n${msg.action?.pdfReportTitle || 'Historical Statement'}\nOpen and print from Ghanshyam kids wear store app.`
                                )
                              }
                              className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="Share on WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. CREATE BILL ACTION */}
                      {msg.action.actionType === 'CREATE_BILL' &&
                        msg.action.invoice && (
                          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-indigo-600" />
                                Invoice Generated: {msg.action.invoice.invoiceNumber}
                              </span>
                              <span className="text-xs font-black text-indigo-700">
                                ₹{msg.action.invoice.netTotal.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => onViewInvoice(msg.action!.invoice!)}
                                className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                <span>View Receipt</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  shareReportWhatsApp(
                                    `*INVOICE ${msg.action!.invoice!.invoiceNumber}*\nStore: ${storeSettings.storeName}\nCustomer: ${msg.action!.invoice!.customerName}\nItem: ${msg.action!.invoice!.items[0]?.itemName || 'Garment'}\nAmount: ₹${msg.action!.invoice!.netTotal.toFixed(2)}\nThank you for shopping at Ghanshyam kids wear!`
                                  )
                                }
                                className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          </div>
                        )}

                      {/* 4. TRIGGER REMINDER ACTION */}
                      {msg.action.actionType === 'TRIGGER_REMINDER' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                              <Share2 className="w-4 h-4 text-emerald-600" />
                              Payment Reminder: {msg.action.reminderCustomerName}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                              Ready
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (msg.action?.reminderCustomerId) {
                                onTriggerReminder(msg.action.reminderCustomerId);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Open WhatsApp/SMS Reminder & Statement</span>
                          </button>
                        </div>
                      )}

                      {/* 5. RECORD TRANSACTION CARD (JAMA / UDHAAR) */}
                      {msg.action.actionType === 'RECORD_TRANSACTION' && (
                        <div
                          className={`rounded-xl p-3 border ${
                            msg.action.transactionType === 'GOT_PAYMENT'
                              ? 'bg-emerald-50/90 border-emerald-200'
                              : 'bg-amber-50/90 border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <CheckCircle2
                                className={`w-4 h-4 ${
                                  msg.action.transactionType === 'GOT_PAYMENT'
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                                }`}
                              />
                              {msg.action.transactionType === 'GOT_PAYMENT'
                                ? 'Jama (Payment Received / Credit)'
                                : 'Udhaar (Debt / You Gave)'}
                            </span>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded ${
                                msg.action.transactionType === 'GOT_PAYMENT'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              ₹{msg.action.amount?.toFixed(0)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 font-medium">
                            Customer: <strong className="text-slate-950 font-bold">{msg.action.customerName}</strong>
                          </div>
                          <button
                            onClick={() => {
                              onNavigateTab('KHATA');
                            }}
                            className="mt-2 w-full flex items-center justify-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            <span>Open Khata Ledger</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* 6. VERIFY BILL / INPUT DESCRIPTION CARD */}
                      {msg.action.actionType === 'VERIFY_BILL' && (
                        (() => {
                          const action = msg.action;
                          if (!action) return null;
                          return (
                            <div className="rounded-2xl p-4 bg-amber-50/90 border border-amber-300 shadow-sm space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                                  {action.needsDescription ? (
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                  )}
                                  <span>
                                    {action.needsDescription
                                      ? 'Item Description Required'
                                      : 'Verify Item Description'}
                                  </span>
                                </span>
                                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                                  ₹{action.amount?.toFixed(0)}
                                </span>
                              </div>

                              <div className="text-xs text-slate-700 space-y-1">
                                <p>
                                  Customer: <strong className="text-slate-950 font-bold">{action.customerName}</strong>
                                </p>
                              </div>

                              {completedBills.has(msg.id) ? (
                                <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Bill generated & preview opened!</span>
                                </div>
                              ) : (
                                (() => {
                                  const currentDesc =
                                    draftInputs[msg.id] !== undefined
                                      ? draftInputs[msg.id]
                                      : action.extractedDescription || '';
                                  const isCloth = isClothingOrKidsItem(currentDesc);
                                  const currentSize =
                                    draftSizes[msg.id] !== undefined
                                      ? draftSizes[msg.id]
                                      : action.invoice?.items[0]?.size || (isCloth ? '2-4 Yrs' : '');

                                  return (
                                    <div className="space-y-2.5">
                                      <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                          {action.needsDescription
                                            ? 'Type Item Description *'
                                            : 'Verify or Edit Description *'}
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={currentDesc}
                                            onChange={(e) =>
                                              setDraftInputs((prev) => ({
                                                ...prev,
                                                [msg.id]: e.target.value,
                                              }))
                                            }
                                            placeholder="e.g. Water Bill / School Uniform / Party Frock / Baba Suit"
                                            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                          />
                                        </div>
                                      </div>

                                      {/* Size section: Shown only if invoice is for clothes / kapda / kids wear */}
                                      {isCloth ? (
                                        <div className="pt-2 border-t border-amber-200/80 space-y-1.5 animate-in fade-in">
                                          <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-slate-800">
                                              Garment Size / Age (Years):
                                            </label>
                                            <span className="text-[10px] text-amber-800 font-semibold">
                                              Type years or tap quick size
                                            </span>
                                          </div>
                                          <input
                                            type="text"
                                            value={currentSize}
                                            onChange={(e) =>
                                              setDraftSizes((prev) => ({
                                                ...prev,
                                                [msg.id]: e.target.value,
                                              }))
                                            }
                                            placeholder="e.g. 1-2 Yrs, 2-3 Yrs, 4-5 Yrs, 8-10 Yrs"
                                            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                          />
                                          <div className="flex flex-wrap gap-1 pt-0.5">
                                            {[
                                              '0-1 Yrs',
                                              '1-2 Yrs',
                                              '2-4 Yrs',
                                              '4-6 Yrs',
                                              '6-8 Yrs',
                                              '8-10 Yrs',
                                              '10-14 Yrs',
                                            ].map((sz) => (
                                              <button
                                                key={sz}
                                                type="button"
                                                onClick={() =>
                                                  setDraftSizes((prev) => ({
                                                    ...prev,
                                                    [msg.id]: sz,
                                                  }))
                                                }
                                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                                  currentSize === sz
                                                    ? 'bg-amber-600 text-white border-amber-600'
                                                    : 'bg-white text-slate-600 border-amber-200 hover:bg-amber-100'
                                                }`}
                                              >
                                                {sz}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-slate-500 font-medium italic bg-amber-100/50 px-2 py-1 rounded-lg">
                                          Size section hidden (non-clothing item)
                                        </p>
                                      )}

                                      <button
                                        type="button"
                                        disabled={!currentDesc.trim()}
                                        onClick={() => {
                                          handleConfirmBillFromCard(
                                            msg.id,
                                            action.customerName || 'Customer',
                                            action.amount || 0,
                                            currentDesc,
                                            action.invoice,
                                            isCloth ? currentSize : ''
                                          );
                                        }}
                                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                                      >
                                        <Receipt className="w-4 h-4" />
                                        <span>
                                          {action.needsDescription
                                            ? 'Create Bill With Description'
                                            : `👉 Verify & Generate Bill (₹${action.amount?.toFixed(0)})`}
                                        </span>
                                      </button>
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          );
                        })()
                      )}

                      {/* 7. CASHBOOK ENTRY CARD (CASH OUT / CASH IN) */}
                      {msg.action.actionType === 'ADD_CASH' && (
                        <div
                          className={`rounded-2xl p-4 border shadow-sm ${
                            msg.action.cashType === 'CASH_OUT'
                              ? 'bg-red-50/90 border-red-200'
                              : 'bg-emerald-50/90 border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black flex items-center gap-1.5 text-slate-900">
                              <Wallet
                                className={`w-4 h-4 ${
                                  msg.action.cashType === 'CASH_OUT'
                                    ? 'text-red-600'
                                    : 'text-emerald-600'
                                }`}
                              />
                              <span>
                                {msg.action.cashType === 'CASH_OUT'
                                  ? '💸 Cash Out (Expense / Payout)'
                                  : '💵 Cash In (Income / Recovery)'}
                              </span>
                            </span>
                            <span
                              className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                                msg.action.cashType === 'CASH_OUT'
                                  ? 'bg-red-200 text-red-900'
                                  : 'bg-emerald-200 text-emerald-900'
                              }`}
                            >
                              {msg.action.cashType === 'CASH_OUT' ? '-' : '+'}₹
                              {msg.action.amount?.toFixed(2)}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 space-y-1 mb-3">
                            <p>
                              Category: <strong className="font-bold text-slate-950">{msg.action.cashCategory || 'Shop Expense'}</strong>
                            </p>
                            {msg.action.note && (
                              <p className="text-slate-600 font-medium">
                                Note: {msg.action.note}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => onNavigateTab('CASHBOOK')}
                            className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            <span>View Cashbook Drawer Register</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* 8. GENERIC DATABASE WRITE FEEDBACK */}
                      {msg.action.actionType !== 'REPORT' &&
                        msg.action.actionType !== 'CREATE_BILL' &&
                        msg.action.actionType !== 'VERIFY_BILL' &&
                        msg.action.actionType !== 'ADD_CASH' &&
                        msg.action.actionType !== 'TRIGGER_REMINDER' &&
                        msg.action.actionType !== 'OPEN_PDF_STATEMENT' &&
                        msg.action.actionType !== 'RECORD_TRANSACTION' && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Action executed live into store ledger & database!</span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-2 shrink-0 no-scrollbar">
          {[
            '💸 500 Ka Bijali Bill Bhara',
            '🚚 Raju Supplier Ko 2000 Cash Diya',
            '☕ Chay Nashte Ka 50 Nikala',
            '🧾 Ghanshyam 1500rs Bill Likho Water Bill',
            '📊 Udhar Kitna Baki Hai?',
            '💵 Ramesh Ne 500 Diye',
            '📝 Suresh Ke Naam Par 100 Udhar Lagawo',
            '📄 Meko Meri Historical Report Dikhawo PDF Mein',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip, false)}
              className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar with Voice Mic Toggle & Text Chat Default Mode */}
        <div className="p-3 md:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText, false);
            }}
            className="flex items-center gap-2"
          >
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-3 rounded-2xl transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
              }`}
              title={
                isListening
                  ? 'Listening... Click to stop'
                  : 'Click to speak query in Hinglish or Hindi'
              }
            >
              {isListening ? (
                <Mic className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Standard Text Chat Default Mode Input */}
            <input
              type="text"
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Aap boliye... (Listening in Hinglish/Hindi)'
                  : 'Type your command (e.g. 1500 ka bill banawo likho water bill)...'
              }
              className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:bg-white transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl transition shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
