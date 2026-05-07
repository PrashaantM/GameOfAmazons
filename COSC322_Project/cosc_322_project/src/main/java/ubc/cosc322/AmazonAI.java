package ubc.cosc322;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class AmazonAI {

    public static final int EMPTY = 0;
    public static final int BLACK = 1;
    public static final int WHITE = 2;
    public static final int ARROW = 3;

    private static final long   TIME_LIMIT_MS = 10_000;
    private static final double UCT_C         = 1.2;
    private static final double RAVE_EQUIV    = 300.0;
    private static final int    THREADS       = Math.max(1, Runtime.getRuntime().availableProcessors() - 1);

    static final int[] DR = {-1,-1,-1, 0, 0, 1, 1, 1};
    static final int[] DC = {-1, 0, 1,-1, 1,-1, 0, 1};

    final int myColour;
    final int oppColour;

    public AmazonAI(int myColour) {
        this.myColour  = myColour;
        this.oppColour = opponent(myColour);
    }

    public int getMyColour() { return myColour; }


    public int[][] convertTo2D(ArrayList<Integer> gameState) {
        int[][] board = new int[10][10];
        for (int r = 0; r < 10; r++)
            for (int c = 0; c < 10; c++)
                board[r][c] = gameState.get((r + 1) * 11 + (c + 1));
        return board;
    }

    public Move getBestMove(int[][] board) throws InterruptedException {
        MCTSNode root = new MCTSNode(null, null, myColour, this);
        root.expand(board);
        if (root.children.isEmpty()) return null;

        long deadline = System.currentTimeMillis() + TIME_LIMIT_MS;

        Thread[] workers = new Thread[THREADS];
        for (int t = 0; t < THREADS; t++) {
            workers[t] = new Thread(() -> {
                while (System.currentTimeMillis() < deadline) {
                    int[][] boardCopy = cloneBoard(board);
                    MCTSNode leaf = select(root, boardCopy);
                    double result = evaluate(boardCopy, leaf.sideToMove);
                    backprop(leaf, result);
                }
            });
            workers[t].setDaemon(true);
            workers[t].start();
        }
        for (Thread w : workers) w.join();

        // Pick most-visited child
        MCTSNode best = null;
        for (MCTSNode child : root.children) {
            if (best == null || child.visits > best.visits) best = child;
        }
        System.out.println("MCTS root visits: " + root.visits);
        return best == null ? null : best.move;
    }


    private MCTSNode select(MCTSNode node, int[][] board) {
        while (true) {
            List<MCTSNode> children;
            synchronized (node) { children = node.children; }

            if (children.isEmpty()) return node;

            // Find an unvisited child first
            MCTSNode unvisited = null;
            synchronized (node) {
                for (MCTSNode c : children) {
                    if (c.visits == 0) { unvisited = c; break; }
                }
            }
            if (unvisited != null) {
                applyMove(board, unvisited.move, node.sideToMove);
                synchronized (unvisited) { unvisited.expand(board); }
                return unvisited;
            }

            MCTSNode best = null;
            double bestScore = Double.NEGATIVE_INFINITY;
            synchronized (node) {
                double logParent = Math.log(node.visits + 1);
                for (MCTSNode c : children) {
                    double beta   = RAVE_EQUIV / (c.visits * 3.0 + RAVE_EQUIV);
                    double qMcts  = c.wins / c.visits;
                    double qRave  = c.raveVisits > 0 ? c.raveWins / c.raveVisits : 0.5;
                    double score  = (1 - beta) * qMcts + beta * qRave
                                  + UCT_C * Math.sqrt(logParent / c.visits);
                    if (score > bestScore) { bestScore = score; best = c; }
                }
            }
            applyMove(board, best.move, node.sideToMove);
            node = best;
        }
    }


    private void backprop(MCTSNode leaf, double result) {

        Set<Long> moveSet = new HashSet<>();
        for (MCTSNode n = leaf; n.move != null; n = n.parent)
            moveSet.add(moveKey(n.move));

        MCTSNode cur = leaf;
        while (cur != null) {
            synchronized (cur) {
                cur.visits++;
                cur.wins += result;
                if (cur.parent != null) {
                    for (MCTSNode sib : cur.parent.children) {
                        if (sib.move != null && moveSet.contains(moveKey(sib.move))) {
                            sib.raveVisits++;
                            sib.raveWins += result;
                        }
                    }
                }
            }
            cur = cur.parent;
        }
    }

    private long moveKey(Move m) {
        return ((long) m.startX << 20) | ((long) m.startY << 16)
             | ((long) m.endX   << 12) | ((long) m.endY   <<  8)
             | ((long) m.arrowX <<  4) | m.arrowY;
    }


    double evaluate(int[][] board, int sideToMove) {
        int[] mob  = quickMobility(board);
        int[] terr = floodTerritory(board);

        int myMob   = mob [myColour  - 1];
        int oppMob  = mob [oppColour - 1];
        int myTerr  = terr[myColour  - 1];
        int oppTerr = terr[oppColour - 1];

        if (myMob  == 0) return 0.0;
        if (oppMob == 0) return 1.0;

        double mScore = (double) myMob  / (myMob  + oppMob);
        double tScore = (double) myTerr / (myTerr + oppTerr + 1);

        double phase = 1.0 - (myTerr + oppTerr) / 100.0;
        double wM = 0.5 - 0.2 * phase;
        double wT = 0.5 + 0.2 * phase;

        return Math.max(0.01, Math.min(0.99, wM * mScore + wT * tScore));
    }

    private int[] quickMobility(int[][] board) {
        boolean[] rB = new boolean[100], rW = new boolean[100];
        for (int r = 0; r < 10; r++) {
            for (int c = 0; c < 10; c++) {
                int cell = board[r][c];
                if (cell != BLACK && cell != WHITE) continue;
                boolean[] tgt = (cell == BLACK) ? rB : rW;
                for (int dir = 0; dir < 8; dir++) {
                    int nr = r + DR[dir], nc = c + DC[dir];
                    while (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && board[nr][nc] == EMPTY) {
                        tgt[nr * 10 + nc] = true;
                        nr += DR[dir]; nc += DC[dir];
                    }
                }
            }
        }
        int b = 0, w = 0;
        for (int i = 0; i < 100; i++) { if (rB[i]) b++; if (rW[i]) w++; }
        return new int[]{b, w};
    }

    private int[] floodTerritory(int[][] board) {
        int[][] dB = bfs(board, BLACK), dW = bfs(board, WHITE);
        int[] t = new int[2];
        for (int r = 0; r < 10; r++)
            for (int c = 0; c < 10; c++) {
                if (board[r][c] != EMPTY) continue;
                if      (dB[r][c] < dW[r][c]) t[0]++;
                else if (dW[r][c] < dB[r][c]) t[1]++;
            }
        return t;
    }

    private int[][] bfs(int[][] board, int colour) {
        int[][] dist = new int[10][10];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        int[] q = new int[300]; int head = 0, tail = 0;
        for (int r = 0; r < 10; r++)
            for (int c = 0; c < 10; c++)
                if (board[r][c] == colour) { dist[r][c] = 0; q[tail++] = r * 10 + c; }
        while (head < tail) {
            int cell = q[head++], r = cell / 10, c = cell % 10, d = dist[r][c];
            for (int dir = 0; dir < 8; dir++) {
                int nr = r + DR[dir], nc = c + DC[dir];
                while (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && board[nr][nc] == EMPTY) {
                    if (dist[nr][nc] > d + 1) { dist[nr][nc] = d + 1; q[tail++] = nr * 10 + nc; }
                    nr += DR[dir]; nc += DC[dir];
                }
            }
        }
        return dist;
    }


    List<Move> generateLegalMoves(int[][] board, int colour) {
        List<Move> moves = new ArrayList<>(1024);
        for (int r = 0; r < 10; r++) {
            for (int c = 0; c < 10; c++) {
                if (board[r][c] != colour) continue;
                for (int dir = 0; dir < 8; dir++) {
                    int nr = r + DR[dir], nc = c + DC[dir];
                    while (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && board[nr][nc] == EMPTY) {

                        board[r][c]   = EMPTY;
                        board[nr][nc] = colour;

                        for (int adir = 0; adir < 8; adir++) {
                            int ar = nr + DR[adir], ac = nc + DC[adir];
                            while (ar >= 0 && ar < 10 && ac >= 0 && ac < 10 && board[ar][ac] == EMPTY) {
                                moves.add(new Move(r, c, nr, nc, ar, ac));
                                ar += DR[adir]; ac += DC[adir];
                            }
                        }

                        board[r][c]   = colour;
                        board[nr][nc] = EMPTY;
                        nr += DR[dir]; nc += DC[dir];
                    }
                }
            }
        }
        return moves;
    }


    public void applyMove(int[][] board, Move move, int playerColor) {
        board[move.startX][move.startY] = EMPTY;
        board[move.endX][move.endY]     = playerColor;
        board[move.arrowX][move.arrowY] = ARROW;
    }

    public int[][] cloneBoard(int[][] board) {
        int[][] copy = new int[10][10];
        for (int i = 0; i < 10; i++) copy[i] = board[i].clone();
        return copy;
    }

    int opponent(int colour) { return colour == BLACK ? WHITE : BLACK; }


    class MCTSNode {
        final MCTSNode parent;
        final Move     move;
        final int      sideToMove;
        final AmazonAI ai;

        List<MCTSNode> children = Collections.emptyList();
        volatile double wins       = 0;
        volatile int    visits     = 0;
        volatile double raveWins   = 0;
        volatile int    raveVisits = 0;

        MCTSNode(MCTSNode parent, Move move, int sideToMove, AmazonAI ai) {
            this.parent     = parent;
            this.move       = move;
            this.sideToMove = sideToMove;
            this.ai         = ai;
        }

        void expand(int[][] board) {
            List<Move> moves = ai.generateLegalMoves(board, sideToMove);
            if (moves.isEmpty()) { children = Collections.emptyList(); return; }
            int opp = ai.opponent(sideToMove);
            List<MCTSNode> ch = new ArrayList<>(moves.size());
            for (Move m : moves) ch.add(new MCTSNode(this, m, opp, ai));
            children = ch;
        }
    }
}