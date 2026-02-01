
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  alias: 'alias',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isVerified: 'isVerified',
  price: 'price',
  hashedPin: 'hashedPin',
  bio: 'bio',
  specialties: 'specialties',
  languages: 'languages',
  demoMinutes: 'demoMinutes',
  hourlyRate: 'hourlyRate',
  isProfileVisible: 'isProfileVisible',
  isOnline: 'isOnline',
  email: 'email',
  isEmailVerified: 'isEmailVerified',
  isPhoneVerified: 'isPhoneVerified',
  phoneNumber: 'phoneNumber',
  dateOfBirth: 'dateOfBirth',
  hasAcceptedTerms: 'hasAcceptedTerms',
  gender: 'gender',
  sexualOrientation: 'sexualOrientation',
  profileImage: 'profileImage',
  deletedAt: 'deletedAt',
  failedLoginAttempts: 'failedLoginAttempts',
  lockoutUntil: 'lockoutUntil',
  notificationPreferences: 'notificationPreferences',
  sessionTimeout: 'sessionTimeout',
  theme: 'theme',
  status: 'status'
};

exports.Prisma.MediaFolderScalarFieldEnum = {
  id: 'id',
  name: 'name',
  psychologistId: 'psychologistId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MediaFileScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  type: 'type',
  folderId: 'folderId',
  isLocked: 'isLocked',
  unlockPrice: 'unlockPrice',
  createdAt: 'createdAt'
};

exports.Prisma.MediaUnlockScalarFieldEnum = {
  id: 'id',
  mediaId: 'mediaId',
  patientId: 'patientId',
  paidAt: 'paidAt',
  amount: 'amount'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  patientId: 'patientId',
  psychologistId: 'psychologistId',
  rating: 'rating',
  comment: 'comment',
  isHidden: 'isHidden',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CalendarEventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  startTime: 'startTime',
  endTime: 'endTime',
  type: 'type',
  creatorId: 'creatorId',
  sessionId: 'sessionId',
  location: 'location',
  meetingLink: 'meetingLink',
  isRecurring: 'isRecurring',
  recurrence: 'recurrence',
  shareableLink: 'shareableLink',
  reminders: 'reminders',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceOptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  description: 'description',
  price: 'price',
  duration: 'duration',
  type: 'type',
  billingType: 'billingType',
  isEnabled: 'isEnabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  balance: 'balance',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  amount: 'amount',
  type: 'type',
  status: 'status',
  referenceId: 'referenceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  description: 'description'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  psychologistId: 'psychologistId',
  patientId: 'patientId',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  type: 'type',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  maxParticipants: 'maxParticipants',
  title: 'title'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  changes: 'changes',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.WithdrawalRequestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  status: 'status',
  requestedAt: 'requestedAt',
  reviewedAt: 'reviewedAt',
  reviewedBy: 'reviewedBy',
  rejectionReason: 'rejectionReason',
  transactionId: 'transactionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  paymentCompletedAt: 'paymentCompletedAt',
  paymentProof: 'paymentProof',
  paymentStatus: 'paymentStatus'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  senderId: 'senderId',
  receiverId: 'receiverId',
  content: 'content',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.PayoutMethodScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  details: 'details',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LanguageScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TranslationScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  languageId: 'languageId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventParticipantsScalarFieldEnum = {
  A: 'A',
  B: 'B'
};

exports.Prisma.BlockedPatientScalarFieldEnum = {
  id: 'id',
  psychologistId: 'psychologistId',
  patientId: 'patientId',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.WalletTopupScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  orderId: 'orderId',
  refId: 'refId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DisputeScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  reporterId: 'reporterId',
  amount: 'amount',
  reason: 'reason',
  description: 'description',
  status: 'status',
  resolutionNotes: 'resolutionNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  resolvedAt: 'resolvedAt',
  resolvedBy: 'resolvedBy'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.Role = exports.$Enums.Role = {
  PATIENT: 'PATIENT',
  PSYCHOLOGIST: 'PSYCHOLOGIST',
  ADMIN: 'ADMIN'
};

exports.MediaType = exports.$Enums.MediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO'
};

exports.EventType = exports.$Enums.EventType = {
  SESSION: 'SESSION',
  MEETING: 'MEETING',
  REMINDER: 'REMINDER',
  PERSONAL: 'PERSONAL'
};

exports.ServiceType = exports.$Enums.ServiceType = {
  VIDEO: 'VIDEO',
  AUDIO_ONLY: 'AUDIO_ONLY',
  CHAT: 'CHAT',
  GROUP: 'GROUP'
};

exports.BillingType = exports.$Enums.BillingType = {
  PER_SESSION: 'PER_SESSION',
  PER_MINUTE: 'PER_MINUTE',
  BUNDLE_7_DAY: 'BUNDLE_7_DAY'
};

exports.TransactionType = exports.$Enums.TransactionType = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  SESSION_RESERVE: 'SESSION_RESERVE',
  SESSION_PAYMENT: 'SESSION_PAYMENT',
  REFUND: 'REFUND',
  MEDIA_UNLOCK: 'MEDIA_UNLOCK'
};

exports.TransactionStatus = exports.$Enums.TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.SessionStatus = exports.$Enums.SessionStatus = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PENDING'
};

exports.SessionType = exports.$Enums.SessionType = {
  ONE_ON_ONE: 'ONE_ON_ONE',
  GROUP: 'GROUP'
};

exports.AuditAction = exports.$Enums.AuditAction = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  VERIFY: 'VERIFY',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  REFUND: 'REFUND',
  SETTLE: 'SETTLE',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD'
};

exports.AuditEntity = exports.$Enums.AuditEntity = {
  USER: 'USER',
  SESSION: 'SESSION',
  TRANSACTION: 'TRANSACTION',
  WALLET: 'WALLET',
  SERVICE_OPTION: 'SERVICE_OPTION',
  DISPUTE: 'DISPUTE',
  MEDIA_FOLDER: 'MEDIA_FOLDER',
  MEDIA_FILE: 'MEDIA_FILE',
  PROFILE: 'PROFILE'
};

exports.WithdrawalStatus = exports.$Enums.WithdrawalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  WITHDRAWAL_REQUEST: 'WITHDRAWAL_REQUEST',
  WITHDRAWAL_APPROVED: 'WITHDRAWAL_APPROVED',
  WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  SYSTEM: 'SYSTEM',
  SESSION_REMINDER: 'SESSION_REMINDER',
  SESSION_REQUEST: 'SESSION_REQUEST',
  SESSION_APPROVED: 'SESSION_APPROVED',
  SESSION_REJECTED: 'SESSION_REJECTED'
};

exports.PayoutType = exports.$Enums.PayoutType = {
  BANK: 'BANK',
  ESEWA: 'ESEWA',
  KHALTI: 'KHALTI',
  CONNECT_IPS: 'CONNECT_IPS'
};

exports.TopupStatus = exports.$Enums.TopupStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.DisputeStatus = exports.$Enums.DisputeStatus = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  REFUNDED: 'REFUNDED',
  DISMISSED: 'DISMISSED'
};

exports.Prisma.ModelName = {
  User: 'User',
  MediaFolder: 'MediaFolder',
  MediaFile: 'MediaFile',
  MediaUnlock: 'MediaUnlock',
  Review: 'Review',
  CalendarEvent: 'CalendarEvent',
  ServiceOption: 'ServiceOption',
  Wallet: 'Wallet',
  Transaction: 'Transaction',
  Session: 'Session',
  AuditLog: 'AuditLog',
  WithdrawalRequest: 'WithdrawalRequest',
  Notification: 'Notification',
  Message: 'Message',
  PayoutMethod: 'PayoutMethod',
  Language: 'Language',
  Translation: 'Translation',
  EventParticipants: 'EventParticipants',
  BlockedPatient: 'BlockedPatient',
  WalletTopup: 'WalletTopup',
  Dispute: 'Dispute'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
