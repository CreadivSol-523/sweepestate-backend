import Stripe from "stripe";
import SubscriptionModel from "../models/SubscriptionSchema.js";
import UserModel from "../models/BuyerSchema.js";
SellerModel
import PlanModel from "../models/PlanScheme.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// export const handleCreateSubscription = async (req, res) => {
//   try {
//     const { userId, planId, priceId, email, paymentMethodId, token } = req.body;

//     if (!userId || !planId || !email) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const findUser = (await UserModel.findById(userId)) || (await SellerModel.findById(userId));
//     if (!findUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const findPlan = await PlanModel.findById(planId);
//     if (!findPlan) {
//       return res.status(404).json({ message: "Plan not found" });
//     }

//     console.log(findPlan)

//     // ============================================
//     //         🆓 FREE PLAN HANDLING
//     // ============================================
//     if (findPlan.amount === 0) {
//       // Directly activate free plan — NO Stripe involved
//       const subscription = await SubscriptionModel.create({
//         userId,
//         planId,
//         status: "active",
//         stripeSubscriptionId: null,
//         stripeCustomerId: findUser.customerId || null,
//         startDate: new Date(),
//         currentPeriodEnd: null, // free plan does not expire
//         planRestrictions: findPlan.planRestrictions,
//       });

//       let subscribedPlan;
//       subscribedPlan = {
//         subscription: subscription,
//         plan: findPlan,
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Subscription created successfully",
//         subscribedPlan: subscribedPlan
//       });
//     }

//     // ============================================
//     //         💳 PAID PLAN HANDLING
//     // ============================================

//     if (!priceId) {
//       return res.status(400).json({ message: "priceId is required for paid plans" });
//     }

//     // 1️⃣ Create or get Stripe customer
//     let customerId = findUser.customerId;
//     if (!customerId) {
//       const customer = await stripe.customers.create({ email });
//       findUser.customerId = customer.id;
//       await findUser.save();
//       customerId = customer.id;
//     }

//     // 2️⃣ Create Payment Method (using token instead of card)
//     let finalPaymentMethodId = paymentMethodId;
//     if (!finalPaymentMethodId && token) {
//       const paymentMethod = await stripe.paymentMethods.create({
//         type: "card",
//         card: { token }
//       });
//       finalPaymentMethodId = paymentMethod.id;
//     }

//     // 3️⃣ Attach Payment Method
//     await stripe.paymentMethods.attach(finalPaymentMethodId, {
//       customer: customerId
//     });

//     // 4️⃣ Set as Default Payment Method
//     await stripe.customers.update(customerId, {
//       invoice_settings: { default_payment_method: finalPaymentMethodId }
//     });

//     // 5️⃣ Create Subscription in Stripe
//     const subscription = await stripe.subscriptions.create({
//       customer: customerId,
//       items: [{ price: priceId }],
//       default_payment_method: finalPaymentMethodId,
//       payment_behavior: "allow_incomplete",
//       expand: ["latest_invoice.payment_intent"],
//       metadata: { userId, planId }
//     });

//     // 6️⃣ Confirm payment
//     const paymentIntentId = subscription.latest_invoice.payment_intent?.id;
//     if (paymentIntentId) {
//       await stripe.paymentIntents.confirm(paymentIntentId, {
//         payment_method: finalPaymentMethodId,
//       });
//     }

//     // 7️⃣ Save subscription in DB
//     const savedSubscription = await SubscriptionModel.create({
//       userId,
//       planId,
//       stripeSubscriptionId: subscription.id,
//       stripeCustomerId: findUser.customerId,
//       status: subscription.status,
//       planRestrictions: findPlan.planRestrictions,
//       startDate: subscription.start_date
//         ? new Date(subscription.start_date * 1000)
//         : new Date(),
//       currentPeriodEnd: new Date(
//         subscription.items.data[0].current_period_end * 1000
//       )
//     });

//     let subscribedPlan;
//     subscribedPlan = {
//       subscription: savedSubscription,
//       plan: findPlan,
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Subscription created successfully",
//       subscribedPlan: subscribedPlan
//     });

//   } catch (error) {
//     console.error("❌ Error creating subscription:", error);
//     res.status(500).json({ message: "Failed to create subscription", error });
//   }
// };

// export const handleDowngradeSubscription = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const { downgradeTo } = req.body;

//     const existingSub = await SubscriptionModel.findOne({
//       userId,
//       status: "active"
//     });

//     if (!existingSub?.stripeSubscriptionId) {
//       return res.status(400).json({ message: "Active paid subscription not found" });
//     }

//     if (existingSub.downgradeScheduled) {
//       return res.status(400).json({
//         message: "Downgrade already scheduled",
//         downgradeDate: existingSub.endDate
//       });
//     }

//     const freePlan = await PlanModel.findOne({
//       _id: downgradeTo,
//       amount: 0,
//       active: true
//     });

//     if (!freePlan) {
//       return res.status(404).json({ message: "Invalid Free Plan" });
//     }

//     const stripeSub = await stripe.subscriptions.update(
//       existingSub.stripeSubscriptionId,
//       { cancel_at_period_end: true }
//     );
//     const downgradeDate = new Date(stripeSub.cancel_at * 1000)
//     const requestedAt = new Date();
//     const message = downgradeDate
//       ? `Your subscription will downgrade to the Free plan on ${downgradeDate.toDateString()}.`
//       : "Your subscription downgrade is scheduled.";

//     await SubscriptionModel.findByIdAndUpdate(existingSub._id, {
//       endDate: downgradeDate,
//       downgradeScheduled: true,
//       downgradeRequestedAt: requestedAt,
//       downgradeMessage: message
//     });

//     return res.status(200).json({
//       message: "Subscription downgrade scheduled successfully",
//       downgradeDate,
//       downgradeRequestedAt: requestedAt
//     });

//   } catch (error) {
//     console.error("❌ Downgrade failed:", error);
//     next(error);
//   }
// };

// export const handleGetCurrentPlanId = async (req, res, next) => {
//   try {

//     const { userId } = req.params;
//     const getPlan = await SubscriptionModel.findOne({
//       userId: userId,
//       status: "active"
//     })
//     const plan = await PlanModel.findById(getPlan.planId);
//     const canDowngrade = plan.amount === 0 ? false : true
//     res.status(200).json({ planId: getPlan.planId, canDowngrade, priceId: plan.priceId, plan: getPlan })
//   } catch (error) {
//     console.log(error);
//     next(error)
//   }
// }

// export const handleUpgradeSubscription = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const { upgradeTo, paymentMethodId, token } = req.body;

//     const findUser = await UserModel.findById(userId);
//     if (!findUser?.customerId) {
//       return res.status(400).json({ message: "Stripe customer not found" });
//     }

//     // 1️⃣ Existing active subscription
//     const existingSub = await SubscriptionModel.findOne({
//       userId,
//       status: "active"
//     });

//     if (!existingSub) {
//       return res.status(400).json({ message: "Active subscription not found" });
//     }

//     // 2️⃣ Validate new paid plan
//     const newPlan = await PlanModel.findById(upgradeTo);
//     if (!newPlan?.priceId || newPlan.amount <= 0) {
//       return res.status(404).json({ message: "Invalid paid plan" });
//     }

//     const customerId = findUser.customerId;

//     // 3️⃣ Payment method handling
//     let finalPaymentMethodId = paymentMethodId;
//     if (!finalPaymentMethodId && token) {
//       const pm = await stripe.paymentMethods.create({
//         type: "card",
//         card: { token }
//       });
//       finalPaymentMethodId = pm.id;
//     }

//     if (!finalPaymentMethodId) {
//       return res.status(400).json({ message: "Payment method required" });
//     }

//     // 4️⃣ Attach & set default payment method
//     await stripe.paymentMethods.attach(finalPaymentMethodId, { customer: customerId });
//     await stripe.customers.update(customerId, {
//       invoice_settings: { default_payment_method: finalPaymentMethodId }
//     });

//     // 5️⃣ Create NEW subscription (instant charge)
//     const newStripeSub = await stripe.subscriptions.create({
//       customer: customerId,
//       items: [{ price: newPlan.priceId }],
//       default_payment_method: finalPaymentMethodId,
//       payment_behavior: "allow_incomplete",
//       expand: ["latest_invoice.payment_intent"],
//       metadata: {
//         userId: String(userId),
//         planId: String(newPlan._id)
//       }
//     });

//     // 6️⃣ Confirm payment
//     const paymentIntent = newStripeSub.latest_invoice?.payment_intent;
//     if (paymentIntent?.id) {
//       await stripe.paymentIntents.confirm(paymentIntent.id, {
//         payment_method: finalPaymentMethodId
//       });
//     }

//     // 7️⃣ Cancel OLD subscription ONLY if it has a Stripe subscription
//     if (existingSub.stripeSubscriptionId) {
//       await stripe.subscriptions.update(existingSub.stripeSubscriptionId, {
//         cancel_at_period_end: false,
//         status: "canceled"
//       });
//     }

//     // 8️⃣ Update DB
//     await SubscriptionModel.findByIdAndUpdate(existingSub._id, {
//       planId: newPlan._id,
//       stripeSubscriptionId: newStripeSub.id,
//       stripeCustomerId: customerId,
//       status: newStripeSub.status,
//       startDate: new Date(),
//       endDate: null,
//       currentPeriodEnd: new Date(
//         newStripeSub.items.data[0].current_period_end * 1000
//       ),

//       downgradeScheduled: false,
//       downgradeRequestedAt: null,
//       downgradeMessage: "",
//       planRestrictions: newPlan.planRestrictions
//     });

//     return res.status(200).json({
//       message: "Subscription upgraded successfully",
//       subscriptionId: newStripeSub.id
//     });

//   } catch (error) {
//     console.error("❌ Upgrade failed:", error);
//     next(error);
//   }
// };

export const HandleGetPaymentIntent = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount * 100,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    })
    res.status(200).json({ getPaymentIntent: paymentIntent.client_secret });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}




// APPLE STOREKIT VERSIONS 
import axios from "axios";
import SellerModel from "../models/SellerSchema.js";

export const handleCreateSubscription = async (req, res) => {
  try {
    const { userId, planId, email, receipt } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const findUser =
      (await UserModel.findById(userId)) ||
      (await SellerModel.findById(userId));

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const findPlan = await PlanModel.findById(planId);
    if (!findPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // ============================================
    //         🆓 FREE PLAN HANDLING (UNCHANGED)
    // ============================================
    if (findPlan.amount === 0) {
      const subscription = await SubscriptionModel.create({
        userId,
        planId,
        status: "active",
        stripeSubscriptionId: null,
        stripeCustomerId: findUser.customerId || null,
        startDate: new Date(),
        currentPeriodEnd: null,
        planRestrictions: findPlan.planRestrictions,
      });

      return res.status(200).json({
        success: true,
        message: "Subscription created successfully",
        subscribedPlan: {
          subscription,
          plan: findPlan,
        },
      });
    }

    // ============================================
    //         🍎 APPLE STOREKIT HANDLING
    // ============================================

    if (!receipt) {
      return res.status(400).json({ message: "Receipt is required for Apple subscriptions" });
    }

    // 1️⃣ Validate receipt with Apple
    const appleResponse = await axios.post(
      "https://buy.itunes.apple.com/verifyReceipt",
      {
        "receipt-data": receipt,
        password: process.env.APPLE_SHARED_SECRET,
      }
    );

    let data = appleResponse.data;

    // Handle sandbox fallback
    if (data.status === 21007) {
      const sandboxResponse = await axios.post(
        "https://sandbox.itunes.apple.com/verifyReceipt",
        {
          "receipt-data": receipt,
          password: process.env.APPLE_SHARED_SECRET,
        }
      );
      data = sandboxResponse.data;
    }

    if (data.status !== 0) {
      return res.status(400).json({
        message: "Invalid receipt",
        appleStatus: data.status,
      });
    }

    // 2️⃣ Extract latest subscription info
    const latestReceipt =
      data.latest_receipt_info?.[data.latest_receipt_info.length - 1];

    if (!latestReceipt) {
      return res.status(400).json({ message: "No subscription data found" });
    }

    const startDate = new Date(parseInt(latestReceipt.purchase_date_ms));
    const expiryDate = new Date(parseInt(latestReceipt.expires_date_ms));

    // 3️⃣ Save subscription in DB (reuse your schema)
    const savedSubscription = await SubscriptionModel.create({
      userId,
      planId,

      // 👇 reuse Stripe fields for Apple (no schema change needed)
      stripeSubscriptionId: latestReceipt.original_transaction_id,
      stripeCustomerId: null,

      status: expiryDate > new Date() ? "active" : "canceled",
      startDate,
      currentPeriodEnd: expiryDate,
      endDate: expiryDate,

      planRestrictions: findPlan.planRestrictions,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription created successfully",
      subscribedPlan: {
        subscription: savedSubscription,
        plan: findPlan,
      },
    });

  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    res.status(500).json({
      message: "Failed to create subscription",
      error: error.message,
    });
  }
};

export const handleDowngradeSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { downgradeTo } = req.body;

    const existingSub = await SubscriptionModel.findOne({
      userId,
      status: "active",
    });

    if (!existingSub) {
      return res.status(400).json({
        message: "Active subscription not found",
      });
    }

    if (existingSub.downgradeScheduled) {
      return res.status(400).json({
        message: "Downgrade already scheduled",
        downgradeDate: existingSub.endDate || existingSub.currentPeriodEnd,
      });
    }

    const freePlan = await PlanModel.findOne({
      _id: downgradeTo,
      amount: 0,
      active: true,
    });

    if (!freePlan) {
      return res.status(404).json({
        message: "Invalid Free Plan",
      });
    }

    // 🧠 Apple does NOT allow forced downgrade
    // So we just mark it in DB and guide user

    const downgradeDate =
      existingSub.currentPeriodEnd || existingSub.endDate;

    const requestedAt = new Date();

    const message = downgradeDate
      ? `Your subscription will downgrade after ${downgradeDate.toDateString()}. Please cancel your subscription from Apple settings to avoid renewal.`
      : "Please cancel your subscription from Apple settings to downgrade.";

    await SubscriptionModel.findByIdAndUpdate(existingSub._id, {
      endDate: downgradeDate,
      downgradeScheduled: true,
      downgradeRequestedAt: requestedAt,
      downgradeMessage: message,
    });

    return res.status(200).json({
      message: "Downgrade request saved. User must cancel via Apple.",
      downgradeDate,
      downgradeRequestedAt: requestedAt,
    });

  } catch (error) {
    console.error("❌ Downgrade failed:", error);
    next(error);
  }
};

export const handleGetCurrentPlanId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const getPlan = await SubscriptionModel.findOne({
      userId,
      status: "active"
    });

    if (!getPlan) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    const plan = await PlanModel.findById(getPlan.planId);

    const canDowngrade = plan?.amount === 0 ? false : true;

    return res.status(200).json({
      planId: getPlan.planId,
      canDowngrade,
      // ❌ priceId not needed for Apple, but kept for compatibility
      priceId: plan?.priceId || null,
      plan: getPlan
    });

  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const handleUpgradeSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { upgradeTo, receipt } = req.body;

    if (!receipt) {
      return res.status(400).json({
        message: "Receipt is required for Apple upgrade"
      });
    }

    // 1️⃣ Find user
    const findUser =
      (await UserModel.findById(userId)) ||
      (await SellerModel.findById(userId));

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Existing subscription
    const existingSub = await SubscriptionModel.findOne({
      userId,
      status: "active"
    });

    if (!existingSub) {
      return res.status(400).json({
        message: "Active subscription not found"
      });
    }

    // 3️⃣ Validate new plan
    const newPlan = await PlanModel.findById(upgradeTo);
    if (!newPlan || newPlan.amount <= 0) {
      return res.status(404).json({
        message: "Invalid paid plan"
      });
    }

    // 4️⃣ Validate receipt with Apple
    let appleResponse = await axios.post(
      "https://buy.itunes.apple.com/verifyReceipt",
      {
        "receipt-data": receipt,
        password: process.env.APPLE_SHARED_SECRET
      }
    );

    let data = appleResponse.data;

    // sandbox fallback
    if (data.status === 21007) {
      const sandboxResponse = await axios.post(
        "https://sandbox.itunes.apple.com/verifyReceipt",
        {
          "receipt-data": receipt,
          password: process.env.APPLE_SHARED_SECRET
        }
      );
      data = sandboxResponse.data;
    }

    if (data.status !== 0) {
      return res.status(400).json({
        message: "Invalid receipt",
        appleStatus: data.status
      });
    }

    // 5️⃣ Extract latest subscription
    const latestReceipt =
      data.latest_receipt_info?.[data.latest_receipt_info.length - 1];

    const startDate = new Date(parseInt(latestReceipt.purchase_date_ms));
    const expiryDate = new Date(parseInt(latestReceipt.expires_date_ms));

    // 6️⃣ Update existing subscription (NO new Stripe sub)
    await SubscriptionModel.findByIdAndUpdate(existingSub._id, {
      planId: newPlan._id,

      // reuse field
      stripeSubscriptionId: latestReceipt.original_transaction_id,

      status: expiryDate > new Date() ? "active" : "canceled",
      startDate,
      currentPeriodEnd: expiryDate,
      endDate: expiryDate,

      downgradeScheduled: false,
      downgradeRequestedAt: null,
      downgradeMessage: "",
      planRestrictions: newPlan.planRestrictions
    });

    return res.status(200).json({
      message: "Subscription upgraded successfully (Apple handled billing)"
    });

  } catch (error) {
    console.error("❌ Upgrade failed:", error);
    next(error);
  }
};