import { Router } from 'express';
import {
  submitTestResult,
  getSyllabus,
  startExamByTopic,
  submitFullExam,
  verifyLiveFrame,
} from './proctoring.controller';

const router = Router();

router.get('/syllabus', getSyllabus);
router.post('/start-exam', startExamByTopic);
router.post('/submit', submitTestResult);
router.post('/submit-full-exam', submitFullExam);
router.post('/verify-frame', verifyLiveFrame);

export default router;
