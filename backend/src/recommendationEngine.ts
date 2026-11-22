export interface ScoringWeights {
  stockWeight: number;      // default: 0.40
  priceWeight: number;      // default: 0.25
  reliabilityWeight: number;// default: 0.20
  speedWeight: number;      // default: 0.15
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  stockWeight: 0.40,
  priceWeight: 0.25,
  reliabilityWeight: 0.20,
  speedWeight: 0.15,
};

export interface CandidateOffer {
  distributorId: string;
  distributorName: string;
  isVerified: boolean;
  coveragePincodes: string[];
  medicineId: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  batchNumber: string;
  expiryDate: string | Date;
  daysToExpiry: number;
  availableQuantity: number;
  unitPrice: number;
  fulfillmentRating: number;   // 0 - 100
  avgLeadTimeHours: number;    // e.g. 12, 18, 24, 36
}

export interface RecommendationResult {
  candidate: CandidateOffer;
  isEligible: boolean;
  disqualificationReason?: string;
  overallScore: number;       // 0 - 100
  stockScore: number;         // 0 - 100
  priceScore: number;         // 0 - 100
  reliabilityScore: number;   // 0 - 100
  speedScore: number;         // 0 - 100
  explanation: {
    summary: string;
    stockDetails: string;
    priceDetails: string;
    reliabilityDetails: string;
    speedDetails: string;
  };
}

export function rankDistributorOffers(
  candidates: CandidateOffer[],
  requestedQuantity: number,
  destinationPincode?: string,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): RecommendationResult[] {
  // Step 1: Find price range across candidates for normalization
  const eligibleCandidates = candidates.filter((c) => {
    if (!c.isVerified) return false;
    if (destinationPincode && c.coveragePincodes.length > 0 && !c.coveragePincodes.includes(destinationPincode)) {
      return false;
    }
    if (c.daysToExpiry < 60) return false; // Expiry safety threshold
    if (c.availableQuantity < requestedQuantity) return false; // Stock sufficiency
    return true;
  });

  const allPrices = eligibleCandidates.map((c) => c.unitPrice);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 1;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 1;

  const results: RecommendationResult[] = candidates.map((c) => {
    // Hard Eligibility Filtering
    if (!c.isVerified) {
      return {
        candidate: c,
        isEligible: false,
        disqualificationReason: 'Distributor verification status is not approved.',
        overallScore: 0,
        stockScore: 0,
        priceScore: 0,
        reliabilityScore: 0,
        speedScore: 0,
        explanation: {
          summary: 'Ineligible: Account pending regulatory verification.',
          stockDetails: 'N/A',
          priceDetails: 'N/A',
          reliabilityDetails: 'N/A',
          speedDetails: 'N/A',
        },
      };
    }

    if (destinationPincode && c.coveragePincodes.length > 0 && !c.coveragePincodes.includes(destinationPincode)) {
      return {
        candidate: c,
        isEligible: false,
        disqualificationReason: `Delivery not available to pincode ${destinationPincode}.`,
        overallScore: 0,
        stockScore: 0,
        priceScore: 0,
        reliabilityScore: 0,
        speedScore: 0,
        explanation: {
          summary: `Ineligible: Outside delivery service area (${destinationPincode}).`,
          stockDetails: 'N/A',
          priceDetails: 'N/A',
          reliabilityDetails: 'N/A',
          speedDetails: 'N/A',
        },
      };
    }

    if (c.daysToExpiry < 60) {
      return {
        candidate: c,
        isEligible: false,
        disqualificationReason: `Batch expires in ${c.daysToExpiry} days (below 60-day safety limit).`,
        overallScore: 0,
        stockScore: 0,
        priceScore: 0,
        reliabilityScore: 0,
        speedScore: 0,
        explanation: {
          summary: 'Ineligible: Batch close to expiry.',
          stockDetails: 'N/A',
          priceDetails: 'N/A',
          reliabilityDetails: 'N/A',
          speedDetails: 'N/A',
        },
      };
    }

    if (c.availableQuantity < requestedQuantity) {
      return {
        candidate: c,
        isEligible: false,
        disqualificationReason: `Insufficient stock (${c.availableQuantity} available vs ${requestedQuantity} requested).`,
        overallScore: 0,
        stockScore: 0,
        priceScore: 0,
        reliabilityScore: 0,
        speedScore: 0,
        explanation: {
          summary: 'Ineligible: Insufficient confirmed stock.',
          stockDetails: `${c.availableQuantity} units available.`,
          priceDetails: 'N/A',
          reliabilityDetails: 'N/A',
          speedDetails: 'N/A',
        },
      };
    }

    // Factor 1: Stock Score (0 - 100)
    // Deeper available inventory buffer provides higher confidence
    const stockRatio = Math.min(c.availableQuantity / (requestedQuantity * 3), 1.0);
    const stockScore = parseFloat((70 + stockRatio * 30).toFixed(1)); // 70-100 range for sufficient stock

    // Factor 2: Price Score (0 - 100)
    // Cheaper is better (inverted normalization)
    let priceScore = 90.0;
    if (maxPrice > minPrice) {
      priceScore = parseFloat((100 - ((c.unitPrice - minPrice) / (maxPrice - minPrice)) * 40).toFixed(1));
    } else {
      priceScore = 95.0;
    }

    // Factor 3: Reliability Score (0 - 100)
    // Directly based on verified historical fulfillment rating
    const reliabilityScore = parseFloat(Math.min(Math.max(c.fulfillmentRating, 0), 100).toFixed(1));

    // Factor 4: Speed Score (0 - 100)
    // Turnaround time: 12h = 100, 24h = 85, 36h = 70, 48h = 50
    let speedScore = 70.0;
    if (c.avgLeadTimeHours <= 12) speedScore = 100.0;
    else if (c.avgLeadTimeHours <= 18) speedScore = 92.0;
    else if (c.avgLeadTimeHours <= 24) speedScore = 85.0;
    else if (c.avgLeadTimeHours <= 36) speedScore = 72.0;
    else speedScore = 55.0;

    // Weighted Overall Score
    const overallScore = parseFloat(
      (
        stockScore * weights.stockWeight +
        priceScore * weights.priceWeight +
        reliabilityScore * weights.reliabilityWeight +
        speedScore * weights.speedWeight
      ).toFixed(1)
    );

    return {
      candidate: c,
      isEligible: true,
      overallScore,
      stockScore,
      priceScore,
      reliabilityScore,
      speedScore,
      explanation: {
        summary: `Score ${overallScore}/100 — Confirmed stock buffer (${stockScore}/100), competitive pricing (${priceScore}/100), ${c.fulfillmentRating}% verified fulfillment (${reliabilityScore}/100), and ~${c.avgLeadTimeHours}h delivery (${speedScore}/100).`,
        stockDetails: `${c.availableQuantity} units confirmed on-hand (${c.batchNumber}).`,
        priceDetails: `₹${c.unitPrice.toFixed(2)} per pack.`,
        reliabilityDetails: `${c.fulfillmentRating}% historical fulfillment rate.`,
        speedDetails: `Estimated delivery turnaround: ${c.avgLeadTimeHours} hours.`,
      },
    };
  });

  // Sort: Eligible first, then descending by overall score
  return results.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.overallScore - a.overallScore;
  });
}
