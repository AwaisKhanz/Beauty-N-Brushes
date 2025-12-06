/**
 * Paystack Plan Creation Script
 * Run this script to create subscription plans in Paystack
 * 
 * Usage: ts-node scripts/create-paystack-plans.ts
 */

import { paymentConfig } from '../src/config/payment.config';

interface PlanData {
  name: string;
  amount: number;
  interval: string;
  currency: string;
  description: string;
}

const plans: PlanData[] = [
  {
    name: 'Solo Plan - Ghana',
    amount: 23750, // ₵237.50 in pesewas
    interval: 'monthly',
    currency: 'GHS',
    description: 'Solo provider plan for Ghana - Monthly subscription',
  },
  {
    name: 'Salon Plan - Ghana',
    amount: 61250, // ₵612.50 in pesewas
    interval: 'monthly',
    currency: 'GHS',
    description: 'Salon/team plan for Ghana - Monthly subscription',
  },
  {
    name: 'Solo Plan - Nigeria',
    amount: 2945000, // ₦29,450 in kobo
    interval: 'monthly',
    currency: 'NGN',
    description: 'Solo provider plan for Nigeria - Monthly subscription',
  },
  {
    name: 'Salon Plan - Nigeria',
    amount: 7595000, // ₦75,950 in kobo
    interval: 'monthly',
    currency: 'NGN',
    description: 'Salon/team plan for Nigeria - Monthly subscription',
  },
];

async function createPlan(planData: PlanData): Promise<string> {
  const response = await fetch('https://api.paystack.co/plan', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create plan ${planData.name}: ${error.message}`);
  }

  const data = await response.json();
  return data.data.plan_code;
}

async function createAllPlans() {
  console.log('🚀 Creating Paystack subscription plans...\n');

  const planCodes: Record<string, string> = {};

  for (const plan of plans) {
    try {
      console.log(`Creating: ${plan.name}...`);
      const planCode = await createPlan(plan);
      console.log(`✅ Created: ${planCode}\n`);

      // Store plan codes
      if (plan.name.includes('Solo') && plan.currency === 'GHS') {
        planCodes.PAYSTACK_SOLO_GHS_PLAN = planCode;
      } else if (plan.name.includes('Salon') && plan.currency === 'GHS') {
        planCodes.PAYSTACK_SALON_GHS_PLAN = planCode;
      } else if (plan.name.includes('Solo') && plan.currency === 'NGN') {
        planCodes.PAYSTACK_SOLO_NGN_PLAN = planCode;
      } else if (plan.name.includes('Salon') && plan.currency === 'NGN') {
        planCodes.PAYSTACK_SALON_NGN_PLAN = planCode;
      }
    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n📋 Add these to your .env file:\n');
  console.log('# Paystack Plan Codes - Ghana');
  console.log(`PAYSTACK_SOLO_GHS_PLAN=${planCodes.PAYSTACK_SOLO_GHS_PLAN || 'NOT_CREATED'}`);
  console.log(`PAYSTACK_SALON_GHS_PLAN=${planCodes.PAYSTACK_SALON_GHS_PLAN || 'NOT_CREATED'}`);
  console.log('\n# Paystack Plan Codes - Nigeria');
  console.log(`PAYSTACK_SOLO_NGN_PLAN=${planCodes.PAYSTACK_SOLO_NGN_PLAN || 'NOT_CREATED'}`);
  console.log(`PAYSTACK_SALON_NGN_PLAN=${planCodes.PAYSTACK_SALON_NGN_PLAN || 'NOT_CREATED'}`);
  console.log('\n✅ All plans created successfully!');
}

// Run the script
createAllPlans().catch(console.error);
