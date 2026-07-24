declare module "sentiment" {
  class Sentiment {
    constructor(options?: unknown);
    analyze(text: string): {
      score: number;
      positive: string[];
      negative: string[];
    };
  }

  export default Sentiment;
}
