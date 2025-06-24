/**
 * AddItemPage Component
 *
 * This page provides a user interface for adding a new payment item.
 * It uses the customer-specified PaymentItemForm component which handles
 * all form logic, submission, and navigation internally.
 */
// This section brings in the tools we need to build this page.
import React from 'react';
// This imports the payment form that we created earlier.
import { PaymentItemForm } from '../components/PaymentItemForm';

// This is the page where you can add a new payment.
// It's a very simple page that just shows the payment form.
const AddItemPage: React.FC = () => {
  // We're simply returning the PaymentItemForm component here.
  // This is like putting a pre-built form onto a blank page.
  return <PaymentItemForm />;
};

// This makes the AddItemPage available to be used in other parts of our app.
export default AddItemPage;
