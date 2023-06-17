import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { imgGen, imgGenEnhanced, alterImg } from '../controller/botController'

export interface WorkerPayload {
  chatId: number,
  prompt: string,
  numImages?: number,
  imgSize?: string,
  filePath?: string,
}

export const taskWorker = new Worker<WorkerPayload,boolean>('botTask', async (job: Job) => {
  switch(job.name) {
    case 'gen':
      await imgGen(job.data)
      console.log('gen',job.data);
      break
    case 'genEn':
      await imgGenEnhanced(job.data)
      break
    case 'alterGeneratedImg':
      await alterImg(job.data)
      break
    default:
      console.log('here')
  }
  return true
}, { connection: config.queue.connection, autorun: false });
