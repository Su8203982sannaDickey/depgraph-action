import * as core from '@actions/core';
import { run, getInputs } from './actionRunner';

async function main(): Promise<void> {
  try {
    const inputs = getInputs();
    await run(inputs);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred.');
    }
  }
}

main();
