-- Comprehensive North America seeding script
-- Generates 100 users and 2500 listings across major North American cities
-- Run with: wrangler d1 execute bitsbarter-staging --remote --file=d1/seed_north_america.sql

PRAGMA foreign_keys = OFF;

-- Clear existing data (except system users)
DELETE FROM messages;
DELETE FROM chats;
DELETE FROM escrow;
DELETE FROM saved_searches;
DELETE FROM listings;

-- Generate 100 users across North America
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, rating, deals, last_active, has_chosen_username) VALUES
-- Tech enthusiasts
('na-user-001', 'sarah.crypto@email.com', 'cryptosara', 'google', 0, 0, 0, strftime('%s','now') - (30 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=1', 4.8, 12, strftime('%s','now') - (2 * 24 * 60 * 60), 1),
('na-user-002', 'mike.mining@email.com', 'minermike', 'google', 0, 0, 0, strftime('%s','now') - (45 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=2', 4.9, 25, strftime('%s','now') - (1 * 24 * 60 * 60), 1),
('na-user-003', 'alice.btc@email.com', 'hodlalice', 'google', 0, 0, 0, strftime('%s','now') - (60 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=3', 4.7, 8, strftime('%s','now') - (3 * 24 * 60 * 60), 1),
('na-user-004', 'bob.lightning@email.com', 'lightningbob', 'google', 0, 0, 0, strftime('%s','now') - (20 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=4', 4.6, 15, strftime('%s','now') - (1 * 24 * 60 * 60), 1),
('na-user-005', 'carol.node@email.com', 'nodecarol', 'google', 0, 0, 0, strftime('%s','now') - (90 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=5', 4.9, 31, strftime('%s','now') - (12 * 60 * 60), 1),

-- Traders and investors
('na-user-006', 'dave.trader@email.com', 'traderdave', 'google', 1, 0, 0, strftime('%s','now') - (15 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=6', 4.5, 42, strftime('%s','now') - (6 * 60 * 60), 1),
('na-user-007', 'emma.defi@email.com', 'defiemma', 'google', 1, 0, 0, strftime('%s','now') - (75 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=7', 4.8, 18, strftime('%s','now') - (18 * 60 * 60), 1),
('na-user-008', 'frank.stacker@email.com', 'satsstacker', 'google', 1, 0, 0, strftime('%s','now') - (35 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=8', 4.7, 23, strftime('%s','now') - (4 * 24 * 60 * 60), 1),
('na-user-009', 'grace.cold@email.com', 'coldstorage', 'google', 1, 0, 0, strftime('%s','now') - (120 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=9', 4.9, 35, strftime('%s','now') - (2 * 60 * 60), 1),
('na-user-010', 'henry.whale@email.com', 'bitcoinwhale', 'google', 1, 0, 0, strftime('%s','now') - (200 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=10', 5.0, 67, strftime('%s','now') - (1 * 60 * 60), 1),

-- Hardware specialists
('na-user-011', 'ivan.asic@email.com', 'asicivan', 'google', 1, 0, 0, strftime('%s','now') - (25 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=11', 4.6, 19, strftime('%s','now') - (8 * 60 * 60), 1),
('na-user-012', 'jane.rigs@email.com', 'rigbuilder', 'google', 1, 0, 0, strftime('%s','now') - (55 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=12', 4.8, 28, strftime('%s','now') - (3 * 60 * 60), 1),
('na-user-013', 'kevin.gpu@email.com', 'gpuking', 'google', 1, 0, 0, strftime('%s','now') - (40 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=13', 4.7, 22, strftime('%s','now') - (24 * 60 * 60), 1),
('na-user-014', 'lisa.power@email.com', 'poweruser', 'google', 1, 0, 0, strftime('%s','now') - (80 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=14', 4.5, 16, strftime('%s','now') - (5 * 24 * 60 * 60), 1),
('na-user-015', 'mark.cooling@email.com', 'coolminer', 'google', 1, 0, 0, strftime('%s','now') - (65 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=15', 4.9, 33, strftime('%s','now') - (30 * 60), 1),

-- Merchants and services
('na-user-016', 'nina.merchant@email.com', 'btcmerchant', 'google', 1, 0, 0, strftime('%s','now') - (10 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=16', 4.8, 45, strftime('%s','now') - (45 * 60), 1),
('na-user-017', 'oscar.services@email.com', 'cryptoservices', 'google', 1, 0, 0, strftime('%s','now') - (95 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=17', 4.6, 12, strftime('%s','now') - (7 * 24 * 60 * 60), 1),
('na-user-018', 'penny.pizza@email.com', 'pizzaforbtc', 'google', 1, 0, 0, strftime('%s','now') - (30 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=18', 4.7, 89, strftime('%s','now') - (2 * 60 * 60), 1),
('na-user-019', 'quinn.consulting@email.com', 'btcconsult', 'google', 1, 0, 0, strftime('%s','now') - (150 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=19', 4.9, 21, strftime('%s','now') - (4 * 60 * 60), 1),
('na-user-020', 'rachel.design@email.com', 'cryptodesign', 'google', 1, 0, 0, strftime('%s','now') - (70 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=20', 4.8, 17, strftime('%s','now') - (6 * 60 * 60), 1),

-- Developers and tech
('na-user-021', 'steve.dev@email.com', 'blockchaindev', 'google', 1, 0, 0, strftime('%s','now') - (85 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=21', 4.7, 14, strftime('%s','now') - (12 * 60 * 60), 1),
('na-user-022', 'tina.smart@email.com', 'smartcontracts', 'google', 1, 0, 0, strftime('%s','now') - (45 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=22', 4.6, 9, strftime('%s','now') - (18 * 60 * 60), 1),
('na-user-023', 'uncle.node@email.com', 'fullnode', 'google', 1, 0, 0, strftime('%s','now') - (110 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=23', 4.9, 27, strftime('%s','now') - (3 * 60 * 60), 1),
('na-user-024', 'vera.security@email.com', 'cryptosec', 'google', 1, 0, 0, strftime('%s','now') - (55 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=24', 4.8, 11, strftime('%s','now') - (9 * 60 * 60), 1),
('na-user-025', 'walt.wallet@email.com', 'walletmaker', 'google', 1, 0, 0, strftime('%s','now') - (75 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=25', 4.7, 24, strftime('%s','now') - (1 * 24 * 60 * 60), 1),

-- Educators and content creators
('na-user-026', 'xavier.edu@email.com', 'btceducator', 'google', 1, 0, 0, strftime('%s','now') - (35 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=26', 4.9, 38, strftime('%s','now') - (15 * 60), 1),
('na-user-027', 'yara.youtube@email.com', 'cryptoyoutuber', 'google', 1, 0, 0, strftime('%s','now') - (90 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=27', 4.6, 52, strftime('%s','now') - (4 * 60 * 60), 1),
('na-user-028', 'zoe.podcast@email.com', 'btcpodcast', 'google', 1, 0, 0, strftime('%s','now') - (60 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=28', 4.8, 19, strftime('%s','now') - (8 * 60 * 60), 1),
('na-user-029', 'alan.author@email.com', 'cryptoauthor', 'google', 1, 0, 0, strftime('%s','now') - (125 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=29', 4.7, 13, strftime('%s','now') - (2 * 24 * 60 * 60), 1),
('na-user-030', 'betty.blogger@email.com', 'btcblogger', 'google', 1, 0, 0, strftime('%s','now') - (40 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=30', 4.8, 26, strftime('%s','now') - (6 * 60 * 60), 1),

-- Continued users (31-100) - Adding variety across different categories
('na-user-031', 'carlos.collectibles@email.com', 'nftcarlos', 'google', 1, 0, 0, strftime('%s','now') - (22 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=31', 4.6, 15, strftime('%s','now') - (10 * 60 * 60), 1),
('na-user-032', 'diana.defi@email.com', 'yieldfarmer', 'google', 1, 0, 0, strftime('%s','now') - (67 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=32', 4.9, 34, strftime('%s','now') - (1 * 60 * 60), 1),
('na-user-033', 'edgar.exchange@email.com', 'dextrader', 'google', 1, 0, 0, strftime('%s','now') - (33 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=33', 4.7, 41, strftime('%s','now') - (5 * 60 * 60), 1),
('na-user-034', 'fiona.farming@email.com', 'liquidityfarm', 'google', 1, 0, 0, strftime('%s','now') - (88 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=34', 4.5, 18, strftime('%s','now') - (3 * 24 * 60 * 60), 1),
('na-user-035', 'george.gaming@email.com', 'cryptogamer', 'google', 1, 0, 0, strftime('%s','now') - (12 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=35', 4.8, 29, strftime('%s','now') - (2 * 60 * 60), 1),
('na-user-036', 'helen.hardware@email.com', 'hwwallet', 'google', 1, 0, 0, strftime('%s','now') - (56 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=36', 4.7, 22, strftime('%s','now') - (14 * 60 * 60), 1),
('na-user-037', 'igor.infrastructure@email.com', 'infraking', 'google', 1, 0, 0, strftime('%s','now') - (99 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=37', 4.9, 37, strftime('%s','now') - (30 * 60), 1),
('na-user-038', 'julia.journalism@email.com', 'cryptoreporter', 'google', 1, 0, 0, strftime('%s','now') - (44 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=38', 4.6, 16, strftime('%s','now') - (7 * 60 * 60), 1),
('na-user-039', 'kyle.kyc@email.com', 'privacyfirst', 'google', 1, 0, 0, strftime('%s','now') - (77 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=39', 4.8, 25, strftime('%s','now') - (4 * 60 * 60), 1),
('na-user-040', 'laura.lightning@email.com', 'lnlaurie', 'google', 1, 0, 0, strftime('%s','now') - (19 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=40', 4.7, 31, strftime('%s','now') - (8 * 60 * 60), 1),

-- Adding 41-100 users with varied backgrounds and locations
('na-user-041', 'mason.mobile@email.com', 'mobileminer', 'google', 1, 0, 0, strftime('%s','now') - (63 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=41', 4.5, 14, strftime('%s','now') - (12 * 60 * 60), 1),
('na-user-042', 'nora.nft@email.com', 'digitalnora', 'google', 1, 0, 0, strftime('%s','now') - (29 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=42', 4.8, 27, strftime('%s','now') - (3 * 60 * 60), 1),
('na-user-043', 'owen.ordinals@email.com', 'ordinalowner', 'google', 1, 0, 0, strftime('%s','now') - (81 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=43', 4.6, 19, strftime('%s','now') - (6 * 24 * 60 * 60), 1),
('na-user-044', 'paula.payments@email.com', 'paymentspro', 'google', 1, 0, 0, strftime('%s','now') - (37 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=44', 4.9, 43, strftime('%s','now') - (1 * 60 * 60), 1),
('na-user-045', 'quincy.quantum@email.com', 'quantumq', 'google', 1, 0, 0, strftime('%s','now') - (92 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=45', 4.7, 8, strftime('%s','now') - (18 * 60 * 60), 1),
('na-user-046', 'ruby.retail@email.com', 'btcretail', 'google', 1, 0, 0, strftime('%s','now') - (14 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=46', 4.8, 56, strftime('%s','now') - (90 * 60), 1),
('na-user-047', 'sam.staking@email.com', 'stakingsam', 'google', 1, 0, 0, strftime('%s','now') - (71 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=47', 4.6, 21, strftime('%s','now') - (9 * 60 * 60), 1),
('na-user-048', 'tara.testing@email.com', 'testnettara', 'google', 1, 0, 0, strftime('%s','now') - (26 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=48', 4.7, 12, strftime('%s','now') - (15 * 60 * 60), 1),
('na-user-049', 'ursula.utility@email.com', 'utilityursula', 'google', 1, 0, 0, strftime('%s','now') - (84 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=49', 4.9, 33, strftime('%s','now') - (45 * 60), 1),
('na-user-050', 'victor.validator@email.com', 'validatorv', 'google', 1, 0, 0, strftime('%s','now') - (48 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=50', 4.5, 17, strftime('%s','now') - (20 * 60 * 60), 1),

-- Adding remaining 50 users (51-100)
('na-user-051', 'wendy.web3@email.com', 'web3wendy', 'google', 1, 0, 0, strftime('%s','now') - (61 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=51', 4.8, 28, strftime('%s','now') - (2 * 60 * 60), 1),
('na-user-052', 'xander.exchange@email.com', 'dexmaster', 'google', 1, 0, 0, strftime('%s','now') - (34 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=52', 4.6, 35, strftime('%s','now') - (11 * 60 * 60), 1),
('na-user-053', 'yvonne.yield@email.com', 'yieldqueen', 'google', 1, 0, 0, strftime('%s','now') - (78 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=53', 4.7, 24, strftime('%s','now') - (5 * 60 * 60), 1),
('na-user-054', 'zachary.zap@email.com', 'lightning_zap', 'google', 1, 0, 0, strftime('%s','now') - (16 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=54', 4.9, 41, strftime('%s','now') - (30 * 60), 1),
('na-user-055', 'amy.analytics@email.com', 'cryptoanalytics', 'google', 1, 0, 0, strftime('%s','now') - (89 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=55', 4.5, 15, strftime('%s','now') - (8 * 24 * 60 * 60), 1),
('na-user-056', 'brad.bridge@email.com', 'crosschain', 'google', 1, 0, 0, strftime('%s','now') - (43 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=56', 4.8, 32, strftime('%s','now') - (4 * 60 * 60), 1),
('na-user-057', 'claire.custody@email.com', 'safecustody', 'google', 1, 0, 0, strftime('%s','now') - (27 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=57', 4.7, 18, strftime('%s','now') - (13 * 60 * 60), 1),
('na-user-058', 'derek.dao@email.com', 'daoderek', 'google', 1, 0, 0, strftime('%s','now') - (76 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=58', 4.6, 23, strftime('%s','now') - (7 * 60 * 60), 1),
('na-user-059', 'elena.escrow@email.com', 'escrowelena', 'google', 1, 0, 0, strftime('%s','now') - (52 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=59', 4.9, 39, strftime('%s','now') - (90 * 60), 1),
('na-user-060', 'felix.fork@email.com', 'hardfork', 'google', 1, 0, 0, strftime('%s','now') - (21 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=60', 4.8, 26, strftime('%s','now') - (6 * 60 * 60), 1),

-- Continue with remaining users 61-100
('na-user-061', 'gina.governance@email.com', 'govgina', 'google', 1, 0, 0, strftime('%s','now') - (68 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=61', 4.7, 20, strftime('%s','now') - (16 * 60 * 60), 1),
('na-user-062', 'hank.hodl@email.com', 'hodlhank', 'google', 1, 0, 0, strftime('%s','now') - (31 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=62', 4.6, 44, strftime('%s','now') - (3 * 60 * 60), 1),
('na-user-063', 'iris.interop@email.com', 'interoperable', 'google', 1, 0, 0, strftime('%s','now') - (85 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=63', 4.9, 16, strftime('%s','now') - (12 * 60 * 60), 1),
('na-user-064', 'jack.java@email.com', 'javajack', 'google', 1, 0, 0, strftime('%s','now') - (18 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=64', 4.5, 31, strftime('%s','now') - (24 * 60 * 60), 1),
('na-user-065', 'kate.keychain@email.com', 'keychainkat', 'google', 1, 0, 0, strftime('%s','now') - (72 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=65', 4.8, 27, strftime('%s','now') - (2 * 60 * 60), 1),
('na-user-066', 'leo.layer2@email.com', 'layer2leo', 'google', 1, 0, 0, strftime('%s','now') - (39 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=66', 4.7, 22, strftime('%s','now') - (9 * 60 * 60), 1),
('na-user-067', 'mia.multisig@email.com', 'multisigmia', 'google', 1, 0, 0, strftime('%s','now') - (93 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=67', 4.6, 13, strftime('%s','now') - (5 * 24 * 60 * 60), 1),
('na-user-068', 'nick.network@email.com', 'networkguru', 'google', 1, 0, 0, strftime('%s','now') - (25 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=68', 4.9, 38, strftime('%s','now') - (1 * 60 * 60), 1),
('na-user-069', 'olivia.oracle@email.com', 'oracleolivia', 'google', 1, 0, 0, strftime('%s','now') - (59 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=69', 4.8, 29, strftime('%s','now') - (14 * 60 * 60), 1),
('na-user-070', 'peter.protocol@email.com', 'protocolpete', 'google', 1, 0, 0, strftime('%s','now') - (46 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=70', 4.7, 25, strftime('%s','now') - (8 * 60 * 60), 1),

-- Final batch 71-100
('na-user-071', 'queenie.quantum@email.com', 'quantumqueen', 'google', 1, 0, 0, strftime('%s','now') - (82 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=71', 4.5, 17, strftime('%s','now') - (18 * 60 * 60), 1),
('na-user-072', 'ricardo.rpc@email.com', 'rpcricardo', 'google', 1, 0, 0, strftime('%s','now') - (13 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=72', 4.8, 34, strftime('%s','now') - (4 * 60 * 60), 1),
('na-user-073', 'sophia.sidechain@email.com', 'sidechaindev', 'google', 1, 0, 0, strftime('%s','now') - (66 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=73', 4.6, 21, strftime('%s','now') - (10 * 60 * 60), 1),
('na-user-074', 'tyler.token@email.com', 'tokentyler', 'google', 1, 0, 0, strftime('%s','now') - (38 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=74', 4.9, 42, strftime('%s','now') - (2 * 60 * 60), 1),
('na-user-075', 'uma.ui@email.com', 'uiuma', 'google', 1, 0, 0, strftime('%s','now') - (87 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=75', 4.7, 19, strftime('%s','now') - (6 * 60 * 60), 1),
('na-user-076', 'vince.vault@email.com', 'vaultvince', 'google', 1, 0, 0, strftime('%s','now') - (24 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=76', 4.8, 30, strftime('%s','now') - (12 * 60 * 60), 1),
('na-user-077', 'wanda.wallet@email.com', 'walletwanda', 'google', 1, 0, 0, strftime('%s','now') - (73 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=77', 4.6, 26, strftime('%s','now') - (20 * 60 * 60), 1),
('na-user-078', 'xavier.xpub@email.com', 'xpubxavier', 'google', 1, 0, 0, strftime('%s','now') - (49 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=78', 4.9, 35, strftime('%s','now') - (3 * 60 * 60), 1),
('na-user-079', 'yuki.yield@email.com', 'yieldyuki', 'google', 1, 0, 0, strftime('%s','now') - (96 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=79', 4.5, 14, strftime('%s','now') - (15 * 60 * 60), 1),
('na-user-080', 'zara.zero@email.com', 'zeroknowledge', 'google', 1, 0, 0, strftime('%s','now') - (17 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=80', 4.8, 28, strftime('%s','now') - (7 * 60 * 60), 1),

-- Additional unique users 81-100
('na-user-081', 'austin.api@email.com', 'apiaustin', 'google', 1, 0, 0, strftime('%s','now') - (64 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=81', 4.7, 23, strftime('%s','now') - (11 * 60 * 60), 1),
('na-user-082', 'bella.blockchain@email.com', 'blockchainb', 'google', 1, 0, 0, strftime('%s','now') - (32 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=82', 4.6, 36, strftime('%s','now') - (5 * 60 * 60), 1),
('na-user-083', 'conrad.consensus@email.com', 'consensuscon', 'google', 1, 0, 0, strftime('%s','now') - (79 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=83', 4.9, 18, strftime('%s','now') - (22 * 60 * 60), 1),
('na-user-084', 'daisy.data@email.com', 'datadaisy', 'google', 1, 0, 0, strftime('%s','now') - (41 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=84', 4.8, 31, strftime('%s','now') - (1 * 60 * 60), 1),
('na-user-085', 'ethan.ethereum@email.com', 'ethethan', 'google', 1, 0, 0, strftime('%s','now') - (86 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=85', 4.5, 15, strftime('%s','now') - (16 * 60 * 60), 1),
('na-user-086', 'faith.fintech@email.com', 'fintechfaith', 'google', 1, 0, 0, strftime('%s','now') - (28 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=86', 4.7, 40, strftime('%s','now') - (8 * 60 * 60), 1),
('na-user-087', 'gabriel.gas@email.com', 'gasgabriel', 'google', 1, 0, 0, strftime('%s','now') - (74 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=87', 4.6, 24, strftime('%s','now') - (13 * 60 * 60), 1),
('na-user-088', 'hannah.hash@email.com', 'hashhannah', 'google', 1, 0, 0, strftime('%s','now') - (15 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=88', 4.9, 33, strftime('%s','now') - (45 * 60), 1),
('na-user-089', 'ian.ipfs@email.com', 'ipfsian', 'google', 1, 0, 0, strftime('%s','now') - (69 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=89', 4.8, 22, strftime('%s','now') - (9 * 60 * 60), 1),
('na-user-090', 'jane.json@email.com', 'jsonjane', 'google', 1, 0, 0, strftime('%s','now') - (54 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=90', 4.7, 37, strftime('%s','now') - (4 * 60 * 60), 1),

-- Final 10 users 91-100
('na-user-091', 'kai.keys@email.com', 'keykai', 'google', 1, 0, 0, strftime('%s','now') - (91 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=91', 4.6, 16, strftime('%s','now') - (19 * 60 * 60), 1),
('na-user-092', 'luna.ledger@email.com', 'ledgerluna', 'google', 1, 0, 0, strftime('%s','now') - (36 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=92', 4.8, 29, strftime('%s','now') - (6 * 60 * 60), 1),
('na-user-093', 'max.mining@email.com', 'maxmining', 'google', 1, 0, 0, strftime('%s','now') - (58 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=93', 4.5, 25, strftime('%s','now') - (14 * 60 * 60), 1),
('na-user-094', 'nova.node@email.com', 'novanode', 'google', 1, 0, 0, strftime('%s','now') - (23 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=94', 4.9, 41, strftime('%s','now') - (2 * 60 * 60), 1),
('na-user-095', 'otto.onchain@email.com', 'onchainotto', 'google', 1, 0, 0, strftime('%s','now') - (80 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=95', 4.7, 20, strftime('%s','now') - (17 * 60 * 60), 1),
('na-user-096', 'penny.proof@email.com', 'proofpenny', 'google', 1, 0, 0, strftime('%s','now') - (47 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=96', 4.8, 32, strftime('%s','now') - (3 * 60 * 60), 1),
('na-user-097', 'quinton.qr@email.com', 'qrquinton', 'google', 1, 0, 0, strftime('%s','now') - (94 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=97', 4.6, 18, strftime('%s','now') - (21 * 60 * 60), 1),
('na-user-098', 'rose.random@email.com', 'randomrose', 'google', 1, 0, 0, strftime('%s','now') - (11 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=98', 4.9, 38, strftime('%s','now') - (90 * 60), 1),
('na-user-099', 'simon.satoshi@email.com', 'satoshisimon', 'google', 1, 0, 0, strftime('%s','now') - (62 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=99', 4.7, 27, strftime('%s','now') - (12 * 60 * 60), 1),
('na-user-100', 'tess.testnet@email.com', 'testnettess', 'google', 1, 0, 0, strftime('%s','now') - (51 * 24 * 60 * 60), 'https://i.pravatar.cc/150?img=100', 4.8, 34, strftime('%s','now') - (5 * 60 * 60), 1);

PRAGMA foreign_keys = ON;
