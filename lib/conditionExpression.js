// Supported operators
const COMPARATORS = {
  eq: "=",
  ne: "<>",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
};

class ConditionExpressionBuilder {
  #names = {};
  #values = {};
  #nameCount = 0;
  #valueCount = 0;

  #nameToken(attr) {
    // Reuse token if attribute already referenced
    const existing = Object.entries(this.#names).find(([, v]) => v === attr);
    if (existing) return existing[0];
    const token = `#a${this.#nameCount++}`;
    this.#names[token] = attr;
    return token;
  }

  #valueToken(value) {
    const token = `:v${this.#valueCount++}`;
    this.#values[token] = value;
    return token;
  }

  #build(node) {
    const [op, arg] = Object.entries(node)[0];

    // Logical operators
    if (op === "and" || op === "or") {
      const parts = arg.map((child) => `(${this.#build(child)})`);
      return parts.join(` ${op.toUpperCase()} `);
    }
    if (op === "not") {
      return `NOT (${this.#build(arg)})`;
    }

    // Comparators: eq, ne, lt, lte, gt, gte
    if (COMPARATORS[op]) {
      const [attr, value] = Object.entries(arg)[0];
      const nameTok = this.#nameToken(attr);
      const valueTok = this.#valueToken(value);
      return `${nameTok} ${COMPARATORS[op]} ${valueTok}`;
    }

    // Function-style operators
    if (op === "begins_with" || op === "contains") {
      const [attr, value] = Object.entries(arg)[0];
      const nameTok = this.#nameToken(attr);
      const valueTok = this.#valueToken(value);
      return `${op}(${nameTok}, ${valueTok})`;
    }

    if (op === "between") {
      const [attr, [low, high]] = Object.entries(arg)[0];
      const nameTok = this.#nameToken(attr);
      const lowTok = this.#valueToken(low);
      const highTok = this.#valueToken(high);
      return `${nameTok} BETWEEN ${lowTok} AND ${highTok}`;
    }

    if (op === "attribute_exists" || op === "attribute_not_exists") {
      const attr = Object.keys(arg)[0];
      const nameTok = this.#nameToken(attr);
      return `${op}(${nameTok})`;
    }

    throw new Error(`Unsupported condition operator: "${op}"`);
  }

  /**
   * Builds the DynamoDB condition expression and returns the necessary components.
   * @param {object} conditionExpressions - The structured condition expression object.
   * @return {object} An object containing the ConditionExpression, ExpressionAttributeNames, and ExpressionAttributeValues.
   */
  build(conditionExpressions) {
    const ConditionExpression = this.#build(conditionExpressions);
    return {
      ConditionExpression,
      ExpressionAttributeNames: this.#names,
      ExpressionAttributeValues: this.#values,
    };
  }
}

/**
 * Builds a DynamoDB condition expression from a structured object.
 * @param {object} conditionExpressions - The structured condition expression object.
 * @return {object} An object containing the ConditionExpression, ExpressionAttributeNames, and ExpressionAttributeValues.
 */
export function buildConditionExpression(conditionExpressions) {
  return new ConditionExpressionBuilder().build(conditionExpressions);
}
