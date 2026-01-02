  
        // --- GLOBAL STATE ---
        // Since there is no database, the state is stored only in memory.
        let appState = {
            currentStep: 1, 
            transactionData: {
                donationType: '',
                amount: 0,
                paymentMethod: '', 
                mobileNumber: '', 
                pinVerified: false,
                transactionId: '',
                timestamp: null,
                status: 'Draft', // Possible states: 'Draft', 'Completed'
            }
        };

        // --- UTILITY FUNCTIONS (No Firebase/Auth needed) ---
        const generateTxnId = () => {
             // Generates a simple mock transaction ID
            return `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        };

        // --- DOM MANIPULATION & UI FUNCTIONS ---
        
        window.showModal = (title, body) => {
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-body').innerHTML = body; // Use innerHTML for <br>
            document.getElementById('message-modal').style.display = 'flex';
        };

        window.closeModal = () => {
            document.getElementById('message-modal').style.display = 'none';
        };

        window.updateUI = () => {
            const step = appState.currentStep;
            const steps = [1, 2, 3];
            const data = appState.transactionData;

            // 1. Update Step Indicators
            steps.forEach(s => {
                const circle = document.getElementById(`step-${s}-circle`);
                const connector = document.getElementById(`connector-${s}-${s + 1}`);
                const isActive = s === step;
                const isCompleted = s < step;

                circle.classList.toggle('active', isActive);
                circle.classList.remove('step-circle-completed');
                
                if (isActive) {
                    circle.style.backgroundColor = 'var(--primary-color)';
                } else if (isCompleted) {
                    circle.classList.add('step-circle-completed');
                    circle.style.backgroundColor = '';
                } else {
                    circle.style.backgroundColor = '#d1d5db';
                }

                if (connector) {
                    connector.classList.toggle('completed', isCompleted || isActive);
                }

                // 2. Display correct step content
                const content = document.getElementById(`step-${s}-content`);
                if (content) {
                    content.style.display = s === step ? 'block' : 'none';
                }
            });

            // 3. Update data displays across steps
            
            // Step 1: Reflect selected option and amount
            document.querySelectorAll('#step-1-content .donation-option').forEach(el => {
                el.classList.remove('selected');
                if (el.dataset.type === data.donationType) {
                    el.classList.add('selected');
                }
            });
            document.getElementById('custom-amount').value = data.amount > 0 ? data.amount : '';
            document.getElementById('next-step-1').disabled = !(data.donationType && data.amount >= 10);


            // Step 2: Verification state & inputs
            document.getElementById('next-step-2').disabled = !data.pinVerified; 
            document.querySelectorAll('#step-2-content .method-option').forEach(el => {
                el.classList.remove('selected');
                if (el.dataset.method === data.paymentMethod) {
                    el.classList.add('selected');
                }
            });
            document.getElementById('mobile-number-input').value = data.mobileNumber;


            // Step 3: Finalization & History (Only active if completed)
            if (data.status === 'Completed') {
                document.getElementById('final-type').textContent = data.donationType || 'N/A';
                document.getElementById('final-amount').textContent = data.amount ? `${data.amount} BDT` : 'N/A';
                document.getElementById('final-method').textContent = data.paymentMethod || 'N/A';
                document.getElementById('final-mobile').textContent = data.mobileNumber || 'N/A';
                document.getElementById('final-generated-id').textContent = data.transactionId || 'N/A';
                document.getElementById('final-timestamp').textContent = data.timestamp ? new Date(data.timestamp).toLocaleString('bn-BD') : 'N/A';
            }
        };


        // --- STEP 1 LOGIC ---
        window.selectDonationType = (element) => {
            document.querySelectorAll('#step-1-content .donation-option').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            
            appState.transactionData.donationType = element.dataset.type;
            const amountInput = document.getElementById('custom-amount');
            const amount = parseFloat(amountInput.value) || 0;
            
            if (amount >= 10) {
                 document.getElementById('next-step-1').disabled = false;
                 document.getElementById('amount-error').style.display = 'none';
            } else {
                 document.getElementById('next-step-1').disabled = true;
            }

            // No saveState needed, just update UI
        };

        document.getElementById('custom-amount').addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value);
            appState.transactionData.amount = amount;
            
            if (appState.transactionData.donationType && amount >= 10) {
                document.getElementById('next-step-1').disabled = false;
                document.getElementById('amount-error').style.display = 'none';
            } else {
                document.getElementById('next-step-1').disabled = true;
                if (!appState.transactionData.donationType || amount < 10) {
                    document.getElementById('amount-error').style.display = 'block';
                    document.getElementById('amount-error').textContent = 'অনুগ্রহ করে অনুদানের ধরণ নির্বাচন করুন এবং একটি বৈধ পরিমাণ (কমপক্ষে ১০ BDT) লিখুন।';
                }
            }
        });


        // --- STEP 2 LOGIC (Payment Method, Mobile, PIN) ---
        
        window.checkStep2Validity = () => {
            const data = appState.transactionData;
            const pinInput = document.getElementById('verification-pin');
            const enteredPin = pinInput.value.trim();
            const mobileInput = document.getElementById('mobile-number-input');
            const enteredMobile = mobileInput.value.trim();
            
            // Reset errors
            document.getElementById('method-error').style.display = 'none';
            document.getElementById('mobile-error').style.display = 'none';
            document.getElementById('pin-error').style.display = 'none';
            document.getElementById('pin-error').style.color = 'var(--error-color)'; // Reset error color

            let allValid = true;

            // Check 1: Payment Method 
            if (!data.paymentMethod) { 
                document.getElementById('method-error').style.display = 'block';
                document.getElementById('method-error').textContent = 'অনুগ্রহ করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।';
                allValid = false; 
            }
            
            // Check 2: Mobile Number (Must be 11 digits)
            if (enteredMobile.length !== 11 || !/^\d{11}$/.test(enteredMobile)) {
                if (enteredMobile.length > 0) {
                    document.getElementById('mobile-error').style.display = 'block';
                    document.getElementById('mobile-error').textContent = 'মোবাইল নম্বরটি অবশ্যই ১১-সংখ্যার হতে হবে।';
                }
                allValid = false;
            }
            
            // Check 3: PIN (Must be exactly 5 digits)
            if (enteredPin.length !== 5 || !/^\d+$/.test(enteredPin)) {
                if (enteredPin.length > 0) {
                    document.getElementById('pin-error').style.display = 'block';
                    document.getElementById('pin-error').textContent = 'পিনটি অবশ্যই ৫-সংখ্যার হতে হবে।';
                }
                allValid = false;
            } 
            
            // Final check and UI update
            appState.transactionData.pinVerified = allValid;
            document.getElementById('next-step-2').disabled = !allValid;
            
            if (allValid) {
                 document.getElementById('pin-error').style.display = 'block';
                 document.getElementById('pin-error').textContent = 'পিন যাচাইকরণ সফল।';
                 document.getElementById('pin-error').style.color = 'var(--primary-color)';
            }
        };


        window.selectPaymentMethod = (element) => {
            document.querySelectorAll('#step-2-content .method-option').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            appState.transactionData.paymentMethod = element.dataset.method;
            window.checkStep2Validity();
        };

        document.getElementById('mobile-number-input').addEventListener('input', (e) => {
            let number = e.target.value.trim();
            number = number.replace(/\D/g, '').substring(0, 11); 
            e.target.value = number;
            appState.transactionData.mobileNumber = number;
            window.checkStep2Validity();
        });

        document.getElementById('verification-pin').addEventListener('input', (e) => {
            let pin = e.target.value.trim();
            pin = pin.replace(/\D/g, '').substring(0, 5);
            e.target.value = pin;
            window.checkStep2Validity();
        });
        

        // --- NAVIGATION LOGIC ---
        
        window.nextStep = () => {
            let isValid = true;
            const currentStep = appState.currentStep;
            const data = appState.transactionData;

            // Pre-validation for Next buttons
            if (currentStep === 1) {
                if (!data.donationType || data.amount < 10) {
                    document.getElementById('amount-error').style.display = 'block';
                    isValid = false;
                }
            } else if (currentStep === 2) {
                // Check validity using the central function before advancing
                window.checkStep2Validity(); 
                if (!data.pinVerified) {
                    isValid = false;
                    return; // Stop execution if not valid
                }
                
                // *** Send to Database ***
                if (isValid) {
                    const txnId = generateTxnId();
                    appState.transactionData.transactionId = txnId;
                    appState.transactionData.timestamp = new Date().toISOString();
                    
                    // Create FormData for POST
                    const formData = new FormData();
                    formData.append('donation_type', data.donationType);
                    formData.append('amount', data.amount);
                    formData.append('payment_method', data.paymentMethod);
                    formData.append('mobile_number', data.mobileNumber);
                    formData.append('transaction_id', txnId);
                    formData.append('timestamp', appState.transactionData.timestamp);
                    
                    // Send POST request
                    fetch('donation.php', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('নেটওয়ার্ক ত্রুটি: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(result => {
                        if (result.success) {
                            appState.transactionData.status = 'Completed';
                            const formattedTime = new Date(appState.transactionData.timestamp).toLocaleTimeString('bn-BD');
                            window.showModal(
                                "অনুদান সফল",
                                `আপনার <strong>${data.amount} BDT</strong> অনুদান সফলভাবে সংরক্ষিত হয়েছে।<br>লেনদেন আইডি: <strong>${txnId}</strong><br>সময়: ${formattedTime}`
                            );
                            // পরবর্তী ধাপে যান
                            appState.currentStep = 3;
                            window.updateUI();
                        } else {
                            window.showModal("ত্রুটি", result.message || "অনুদান সংরক্ষণ ব্যর্থ হয়েছে।");
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        window.showModal("ত্রুটি", "সার্ভারের সাথে সংযোগ ব্যর্থ। XAMPP চালু আছে কি না চেক করুন।");
                    });
                    return;
                }
            }

            if (isValid && currentStep < 3) {
                appState.currentStep += 1;
                window.updateUI();
            }
        };

        window.prevStep = () => {
            if (appState.currentStep > 1) {
                // If moving back from Step 3, revert payment status to Draft 
                if (appState.currentStep === 3) {
                    appState.transactionData.status = 'Draft';
                    appState.transactionData.transactionId = '';
                    appState.transactionData.timestamp = null;
                }
                appState.currentStep -= 1;
                window.updateUI();
            }
        };

        window.resetApp = () => {
             appState = {
                currentStep: 1,
                transactionData: {
                    donationType: '',
                    amount: 0,
                    paymentMethod: '',
                    mobileNumber: '',
                    pinVerified: false,
                    transactionId: '',
                    timestamp: null,
                    status: 'Draft',
                }
            };
            // Clear any old UI values just in case
            document.getElementById('custom-amount').value = '';
            document.getElementById('verification-pin').value = '';
            document.getElementById('mobile-number-input').value = '';
            
            window.updateUI();
            window.showModal("অ্যাপ রিসেট", "অনুদান প্রক্রিয়াটি নতুন করে শুরু করা হয়েছে।");
        };
        
        // --- INITIALIZATION ---
        // Start the UI when the script loads
        window.onload = () => {
            window.updateUI();
        };
