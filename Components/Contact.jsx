import React from "react";
import toast from "react-hot-toast";
import { useForm } from "@formspree/react";

const Contact = () => {
  const notifySuccess = (msg) => toast.success(msg, { duration: 2000 });
  const notifyError = (msg) => toast.error(msg, { duration: 3000 });

  const [state, handleSubmit] = useForm("xbjqyqwp");

  if (state.succeeded) {
    notifySuccess("Message sent successfully!");
  }
  return (
    <>
      <section id="contact" className="ico-contact pos-rel">
        <div className="container">
          <div className="ico-contact__wrap">
            <h2 className="title">Contact with AISquads</h2>

            <form action="" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-lg-6">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="col-lg-6">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Your Email"
                    required
                  />
                </div>
                <div className="col-lg-12">
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Your Message"
                    required
                  />
                </div>
                <div className="ico-contact__btn text-center mt-10">
                  <button
                    className="thm-btn"
                    type="submit"
                    disabled={state.submitting}
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </form>
            <div className="ico-contact__shape-img"></div>
          
          </div>
        </div>
        
      </section>
    </>
  );
};

export default Contact;
