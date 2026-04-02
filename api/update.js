export default async function handler(req, res) {
  try {
    // Get input from frontend
    const body = req.body;

    // TEMP: simulate response (we’ll plug AI back after)
    const result = {
      clientDetails: {},
      financials: {},
      needs: {},
      investment: {},
      insurance: {},
      recommendation: {},
      costs: {},
      acceptance: {},
      disclosures: {},
      fica: {}
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}