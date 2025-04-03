import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  ChevronLeftIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface ProductSelectionProps {
  products: Product[];
  categoryName: string;
  onProductSelect: (productId: string) => void;
  onBackClick: () => void;
  isInView: boolean;
  demoMode?: boolean;
  highlightedProduct?: string | null;
}

const ProductSelection = ({
  products,
  categoryName,
  onProductSelect,
  onBackClick,
  isInView,
  demoMode = false,
  highlightedProduct = null,
}: ProductSelectionProps) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("show");
    } else {
      controls.stop();
    }
  }, [controls, isInView]);

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const PriceBubble = ({ price }: { price: number }) => {
    return (
      <motion.div
        className="text-blue-400 font-medium whitespace-nowrap flex-shrink-0 relative"
        whileHover={{ scale: demoMode ? 1 : 1.03 }}
      >
        <motion.div
          className="absolute inset-0 bg-blue-500/8 rounded-full -m-1 blur-md"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {price.toLocaleString()} ₽
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <motion.button
          onClick={() => !demoMode && onBackClick()}
          whileHover={{ x: demoMode ? 0 : -2 }}
          className="flex items-center gap-1 text-sm text-secondary-light hover:text-blue-400 transition-colors"
        >
          <motion.div
            animate={{ x: [0, -1.5, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </motion.div>
          <span>Назад к категориям</span>
        </motion.button>
        <h3 className="text-lg font-medium text-white mt-2">
          {categoryName}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="inline-block ml-1"
          >
            _
          </motion.span>
        </h3>
      </div>

      <motion.div
        className="flex-1 overflow-y-auto scrollbar-thin pr-1"
        variants={containerAnimation}
        initial="hidden"
        animate={controls}
        exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
      >
        <div className="space-y-2.5">
          {products.map((product, index) => {
            const isHighlighted = highlightedProduct === product.id;

            return (
              <motion.div
                key={product.id}
                variants={itemAnimation}
                whileHover={{
                  scale: demoMode ? 1 : 1.01,
                  boxShadow: demoMode
                    ? "none"
                    : "0 0 15px rgba(59, 130, 246, 0.08)",
                }}
                whileTap={{ scale: demoMode ? 1 : 0.995 }}
                animate={
                  isHighlighted
                    ? {
                        y: [0, -3, 0],
                        boxShadow: [
                          "0 0 0px rgba(59, 130, 246, 0)",
                          "0 0 20px rgba(59, 130, 246, 0.15)",
                          "0 0 0px rgba(59, 130, 246, 0)",
                        ],
                        transition: {
                          duration: 2,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300
                  ${
                    isHighlighted
                      ? "border-blue-500/40 bg-gradient-from/25 ring-1 ring-blue-500/30 ring-offset-1 ring-offset-primary-dark/80"
                      : "border-primary-border/80 bg-gradient-from/10 hover:bg-gradient-from/15"
                  }
                  cursor-pointer
                `}
                onClick={() => !demoMode && onProductSelect(product.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-gradient-from/20 flex items-center justify-center border border-primary-border/70 flex-shrink-0 overflow-hidden"
                    animate={
                      isInView
                        ? {
                            background: [
                              "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.2) 0%, rgba(21, 27, 40, 0.2) 70%)",
                              "radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.2) 0%, rgba(21, 27, 40, 0.2) 70%)",
                              "radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.2) 0%, rgba(21, 27, 40, 0.2) 70%)",
                              "radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.2) 0%, rgba(21, 27, 40, 0.2) 70%)",
                              "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.2) 0%, rgba(21, 27, 40, 0.2) 70%)",
                            ],
                          }
                        : {}
                    }
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <motion.div
                        animate={
                          isInView
                            ? {
                                rotate: isHighlighted
                                  ? [0, 15, 0, -15, 0]
                                  : [0, 8, 0, -8, 0],
                                scale: isHighlighted
                                  ? [1, 1.15, 1]
                                  : [1, 1.08, 1],
                              }
                            : {}
                        }
                        transition={{
                          duration: isHighlighted ? 2 : 6,
                          delay: index * 0.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <ComputerDesktopIcon
                          className={`w-5 h-5 ${
                            isHighlighted ? "text-blue-300" : "text-blue-400"
                          }`}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                  <div className="text-white truncate pr-2">
                    <div className="relative">
                      {product.name}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={isHighlighted ? { scaleX: 1, opacity: 1 } : {}}
                        whileHover={{
                          scaleX: demoMode ? 0 : 1,
                          opacity: demoMode ? 0 : 1,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
                <PriceBubble price={product.price} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
          border-radius: 5px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.3);
          border-radius: 5px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ProductSelection;
