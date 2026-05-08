import React, { useState } from "react";

const Faq = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = [
    {
      question: "What is the Smart DeFi Router Agent?",
      answer: "The Smart DeFi Router Agent is an AI-powered platform that automatically optimizes your USDC placements across multiple DeFi protocols on the Arc blockchain. It uses advanced machine learning to analyze thousands of potential routes and executes the optimal strategy based on your yield targets and risk tolerance—all in seconds with minimal fees."
    },
    {
      question: "How does the AI optimization work?",
      answer: "Our AI agent continuously monitors on-chain data including interest rates, liquidity levels, protocol risk scores, and transaction costs. It uses reinforcement learning algorithms to calculate the optimal distribution of your USDC across lending protocols, staking pools, and liquidity pools. The agent can evaluate thousands of possible routes and select the best one matching your specified criteria (target yield, maximum risk, duration)."
    },
    {
      question: "Why Arc blockchain? What are the advantages?",
      answer: "Arc is specifically designed for stablecoin finance with unique features: (1) Deterministic Instant Finality for fast, reliable transactions, (2) USDC Gas meaning predictable, stable transaction costs, and (3) High-performance infrastructure optimized for DeFi operations. These features ensure maximum net yields by minimizing costs and execution time."
    },
    {
      question: "Is my USDC safe? Are the smart contracts audited?",
      answer: "Yes! Security is our top priority. Our smart contracts are non-custodial (you maintain full control), have been professionally audited, and only interact with vetted, trusted DeFi protocols. The AI continuously monitors protocol risk scores and will automatically avoid protocols with security concerns. You can withdraw your funds at any time."
    },
    {
      question: "What is auto-rebalancing and how does it work?",
      answer: "Auto-rebalancing is an optional feature where the AI continuously monitors your positions. If yields drop below your threshold (e.g., 5%), or if significantly better opportunities arise, the agent automatically withdraws and reallocates your USDC to optimize returns. You set the rules, and the AI executes them—no manual monitoring required."
    },
    {
      question: "How much does it cost to use the Smart DeFi Router?",
      answer: "Transaction costs are minimal and paid in USDC gas on Arc. Typically, executing a multi-protocol route costs less than $1 in fees. There are no platform fees for basic usage. The agent is designed to maximize your net returns after all costs."
    },
    {
      question: "Can I set my own risk tolerance?",
      answer: "Absolutely! When configuring your strategy, you set your maximum risk tolerance on a scale of 1-100. Conservative investors might choose 1-30 (lower risk protocols), moderate 31-70, or aggressive 71-100. The AI will only route your USDC to protocols within your risk parameters."
    },
    {
      question: "What kind of yields can I expect?",
      answer: "Yields vary based on market conditions and your risk tolerance. Historically, our optimized routes have achieved 5-15% APY for USDC across various risk profiles. Conservative strategies typically yield 4-8%, moderate 7-12%, and aggressive 10-15%+. Past performance doesn't guarantee future results."
    },
    {
      question: "Do I need technical knowledge to use this?",
      answer: "No! One of our key advantages is accessibility. You can use simple natural language commands like 'Invest 1,000 USDC for 30 days with moderate risk' and the AI handles all the complex routing and execution. The dashboard provides clear visualizations of your positions and performance."
    },
    {
      question: "Can I withdraw my USDC anytime?",
      answer: "Yes, you maintain full control. You can withdraw all or part of your positions at any time through the dashboard. Keep in mind some protocols may have lock-up periods if you opted into time-locked strategies for higher yields."
    },
    {
      question: "Which DeFi protocols does the agent support?",
      answer: "The agent integrates with multiple vetted protocols on Arc including lending platforms (Compound-style), liquidity pools (Uniswap-style), staking protocols, and yield aggregators. The protocol registry is continuously updated as new, audited protocols launch on Arc."
    },
    {
      question: "How is this different from traditional yield aggregators?",
      answer: "Traditional aggregators often rely on static strategies. Our AI-powered agent: (1) Uses machine learning for dynamic optimization, (2) Leverages Arc's speed and low costs for frequent rebalancing, (3) Provides natural language interface, (4) Offers real-time AI recommendations, and (5) Adapts to changing market conditions automatically."
    }
  ];

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <>
      <section id="faq" className="faq pos-rel pt-140 pb-105">
        <div className="container">
          <div className="sec-title text-center">
            <h5 className="sec-title__subtitle">FAQ</h5>
            <h2 className="sec-title__title">Frequently Asked Questions</h2>
            <p className="sec-title__text">
              Everything you need to know about the Smart DeFi Router Agent
            </p>
          </div>

          <div className="faq__wrap">
            <ul className="accordion_box clearfix">
              {faqs.map((faq, index) => (
                <li
                  key={index}
                  className={`accordion block ${activeIndex === index ? "active-block" : ""}`}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="acc-btn">
                    <span>Q{index + 1}</span> {faq.question}
                  </div>
                  <div className={`acc_body ${activeIndex === index ? "current" : ""}`}>
                    <div className="content">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="faq__sec-shape">
          <div className="shape shape-1">
            <img src="assets/img/shape/s_shape1.png" alt="" />
          </div>
          <div className="shape shape-2">
            <img src="assets/img/shape/s_shape2.png" alt="" />
          </div>
        </div>
      </section>

      <style jsx>{`
        .faq {
          background: linear-gradient(135deg, #16213e 0%, #0f0f23 50%, #1a1a2e 100%);
          position: relative;
          overflow: hidden;
        }

        .faq::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 30% 40%, rgba(102, 126, 234, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(118, 75, 162, 0.12) 0%, transparent 50%);
          pointer-events: none;
        }

        .faq .container {
          position: relative;
          z-index: 1;
        }

        .sec-title__subtitle {
          color: #ffd700 !important;
          font-weight: 600;
        }

        .sec-title__title {
          color: #ffffff !important;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .sec-title__text {
          color: #d0d0d0 !important;
          font-size: 16px;
          margin-top: 10px;
        }

        .faq__wrap {
          max-width: 900px;
          margin: 50px auto 0;
        }

        .accordion_box {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .accordion {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          margin-bottom: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .accordion:hover {
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }

        .acc-btn {
          padding: 20px 25px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: all 0.3s ease;
          position: relative;
        }

        .acc-btn::after {
          content: "+";
          position: absolute;
          right: 25px;
          font-size: 24px;
          font-weight: 700;
          color: #ffd700;
          transition: transform 0.3s ease;
        }

        .active-block {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 215, 0, 0.3);
        }

        .active-block .acc-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }

        .active-block .acc-btn::after {
          content: "−";
          transform: rotate(180deg);
          color: #fff;
        }

        .acc-btn span {
          background: #667eea;
          color: #fff;
          padding: 5px 12px;
          border-radius: 5px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .active-block .acc-btn span {
          background: #ffd700;
          color: #000;
        }

        .acc_body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          background: rgba(0, 0, 0, 0.2);
        }

        .acc_body.current {
          max-height: 500px;
        }

        .content {
          padding: 0 25px 25px;
        }

        .content p {
          color: #e0e0e0;
          line-height: 1.8;
          margin: 0;
          font-size: 15px;
        }

        @media (max-width: 768px) {
          .faq {
            padding-top: 80px !important;
            padding-bottom: 60px !important;
          }

          .acc-btn {
            font-size: 14px;
            padding: 15px 20px;
            padding-right: 50px;
          }

          .acc-btn span {
            font-size: 12px;
            padding: 4px 10px;
          }

          .content {
            padding: 0 20px 20px;
          }

          .content p {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
};

export default Faq;
